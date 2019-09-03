// Report and auto-fix the line breaking and order of imports
// according to the module import conventions

const _ = require('lodash');
const importedGroups = require('../utils/importedGroups');

// The enforced order is the same as the order of each element in a group.
const DEFAULT_GROUPS = [
  'external',
  'internal',
  ['geiger', 'main'],
  'module',
  'parentDirectory',
  'currentDirectory',
  'stylesheet',
];
const DEFAULT_GROUPS_FLATTENED = _.flatten(DEFAULT_GROUPS);
const ALL_WHITESPACE = /^\s*$/;

function addNewBlankLines(currentImportNode, prevImportNode) {
  return (fixer) => fixer.insertTextAfterRange([currentImportNode.start, prevImportNode.end], '\n');
}

/**
 * Sort and mutate the individual rank of each import within its own group alphabetically
 * @param importedItems - an array of import items
 */
function alphabetizeIndividualRanks(importedItems) {
  const importedItemsGroupedByGroupRanks = importedItems.reduce((prev, importedItem) => {
    if (prev[importedItem.rank]) {
      prev[importedItem.rank].push(importedItem.name);
    } else {
      prev[importedItem.rank] = [importedItem.name];
    }
    return prev;
  }, {});
  const sortedGroupRanks = Object.keys(importedItemsGroupedByGroupRanks).sort();

  sortedGroupRanks.forEach((rank) => {
    // Sort the importedItems alphabetically within its own group
    importedItemsGroupedByGroupRanks[rank].sort();
  });
  // Build up the list of alphabetically-sorted importedItems
  const sortedImportedItems = sortedGroupRanks.reduce(
    (prev, rank) => prev.concat(importedItemsGroupedByGroupRanks[rank]),
    [],
  );
  // Find the duplicate importedItems
  const dupSortedImportedItems = sortedImportedItems.filter(
    (val, index, arr) => arr.indexOf(val) !== index,
  );

  // Modify the individual rank of each import
  // according to the its position in sortedImportedItems
  importedItems.forEach((importedItem) => {
    if (
      dupSortedImportedItems.indexOf(importedItem.name) !== -1 &&
      importedItem.node.importKind === 'type'
    ) {
      // When importing modules and Flow types from the same file,
      // always import code first, then Flow types second
      importedItem.rank = sortedImportedItems.indexOf(importedItem.name) + 1;
    } else {
      importedItem.rank = sortedImportedItems.indexOf(importedItem.name);
    }
  });
}

/**
 * Get a message for reporting the unordered
 * @param targetImportItem - import to be moved towards
 * @param outOfOrderItem - import to move
 * @param order - 'before' or 'after'
 * @returns warning message
 */
function createWarningMsg(targetImportItem, outOfOrderItem, order) {
  const outOfOrderImportName =
    outOfOrderItem.node.importKind === 'type'
      ? `'${outOfOrderItem.name}' import type`
      : `'${outOfOrderItem.name}' import`;
  const targetImportName =
    targetImportItem.node.importKind === 'type'
      ? `'${targetImportItem.name}' import type`
      : `'${targetImportItem.name}' import`;

  return `${outOfOrderImportName} should occur ${order} ${targetImportName}`;
}

/**
 * Get an array of unordered import items
 * @param importedItems - an array of import items
 * @returns unordered import items
 */
function findOutOfOrder(importedItems) {
  if (importedItems.length === 0) {
    return [];
  }
  let lastSeenInOrderNode = importedItems[0];
  return importedItems.filter((importedModule) => {
    const res = importedModule.rank < lastSeenInOrderNode.rank;
    if (lastSeenInOrderNode.rank < importedModule.rank) {
      lastSeenInOrderNode = importedModule;
    }
    return res;
  });
}

/**
 * Get the import item where the unordered imports will be moving towards
 * @param importedItems - an array of import items
 * @param outOfOrderItem - an unordered import item
 * @returns the target import item
 */
function findTargetImportItem(importedItems, outOfOrderItem) {
  return importedItems.find((importedItem) => importedItem.rank > outOfOrderItem.rank);
}

/**
 * Get whether a AST node ends with a new line character
 * @param sourceCode - the SourceCode object
 * @param node - the AST node for an import
 * @returns 1 if there is a trailing new line or 2 if there isn't
 */
function hasTrailingSpace(sourceCode, node) {
  const text = sourceCode.text.substring(node.start, node.end + 1);
  return text[text.length - 1] === '\n' ? 1 : 0;
}

/**
 * Implement the auto-fix to sort the imports
 * @param sourceCode - the SourceCode object
 * @param targetImportItemNode - the AST node for the target import
 * @param targetImportItemNode - the AST node for the unordered import
 * @param order - 'before' or 'after'
 * @returns the fixer object
 */
function fixOutOfOrder(sourceCode, targetImportItemNode, outOfOrderItemNode, order) {
  let textToFix;
  const outOfOrderNodeWhiteSpace = hasTrailingSpace(sourceCode, outOfOrderItemNode);
  const targetImportNodeWhiteSpace = hasTrailingSpace(sourceCode, targetImportItemNode);

  if (outOfOrderNodeWhiteSpace) {
    textToFix = sourceCode.text.substring(outOfOrderItemNode.start, outOfOrderItemNode.end + 1);
  } else {
    textToFix = sourceCode.text.substring(outOfOrderItemNode.start, outOfOrderItemNode.end);
    textToFix += '\n';
  }

  const range =
    order === 'after'
      ? [outOfOrderItemNode.start, targetImportItemNode.end + targetImportNodeWhiteSpace]
      : [targetImportItemNode.start, outOfOrderItemNode.end + outOfOrderNodeWhiteSpace];

  let text =
    textToFix + sourceCode.text.substring(targetImportItemNode.start, outOfOrderItemNode.start);
  if (order === 'after') {
    text =
      sourceCode.text.substring(
        outOfOrderItemNode.end + outOfOrderNodeWhiteSpace,
        targetImportItemNode.end + targetImportNodeWhiteSpace,
      ) + textToFix;
  }

  return (fixer) => fixer.replaceTextRange(range, text);
}

/**
 * Get an object with group-rank pairs.
 * @param groups - an array of import groups
 * the enforced order is the same as the order of each element in this groups
 * By default: {
 *   external: 0,
 *   internal: 1,
 *   geiger: 2,
 *   main: 2,
 *   module: 3,
 *   parentDirectory: 4,
 *   currentDirectory: 5,
 *   stylesheet: 6
 *   }
 * @returns group-rank object
 */
function getGroupRanks(groups) {
  const groupRanks = {};

  groups.forEach((group, index) => {
    if (typeof group === 'string') {
      groupRanks[group] = index;
    } else if (Array.isArray(group)) {
      group.forEach((item) => {
        groupRanks[item] = index;
      });
    }
  });
  return groupRanks;
}

/**
 * Get the number of blank lines between two AST nodes
 * @param context - the context object
 * @param firstNode - the first AST node
 * @param secondNode - the second AST node
 * @returns number of blank lines
 */
function getBlankLinesCount(context, firstNode, secondNode) {
  const linesBetweenImports = context
    .getSourceCode()
    .lines.slice(firstNode.loc.end.line, secondNode.loc.start.line - 1);

  return linesBetweenImports.filter((line) => !line.trim().length).length;
}

/**
 * Check whether a group is of the eight default group types
 * @param groups - an array of import groups
 */
function isGroupOfUnknownType(groups) {
  const res = _.flatten(groups).every((group) => DEFAULT_GROUPS_FLATTENED.includes(group));

  if (!res) {
    throw new Error('Incorrect configuration of the rule: Unknown group type');
  }
}

/**
 * Check whether the group has duplicate elements
 * @param groups - an array of import groups
 */
function isGroupDuplicate(groups) {
  const res = _.flatten(groups).every((group, index, self) => self.indexOf(group) === index);

  if (!res) {
    throw new Error('Incorrect configuration of the rule: duplicated groups');
  }
}

/**
 * Get an object of reversed import items for
 * deciding the direction of prompting users to move unordered imports towards
 * @param importedItems - an array of import items
 * @returns an object of import items with reversed rankings
 */
function reverse(importedItems) {
  return importedItems
    .map((importedItem) => ({
      name: importedItem.name,
      rank: -importedItem.rank,
      groupRank: -importedItem.rank,
      node: importedItem.node,
    }))
    .reverse();
}

/**
 * Publish warnings and make fixes for sorting imports
 * @param context - the context object
 * @param importedItems - an array of import items
 */
function reportAndFixOutOfOrder(context, importedItems) {
  const sourceCode = context.getSourceCode();
  const outOfOrder = findOutOfOrder(importedItems);

  if (!outOfOrder.length) {
    return;
  }

  // Reverse the importedItems to see if it has fewer unordered imports.
  const reversedImportedItems = reverse(importedItems);
  const reversedOutOfOrder = findOutOfOrder(reversedImportedItems);

  if (reversedOutOfOrder.length < outOfOrder.length) {
    reversedOutOfOrder.forEach((outOfOrderItem) => {
      const order = 'after';
      const targetImportItem = findTargetImportItem(reversedImportedItems, outOfOrderItem);
      const message = createWarningMsg(targetImportItem, outOfOrderItem, order);

      context.report({
        node: outOfOrderItem.node,
        message,
        fix: fixOutOfOrder(sourceCode, targetImportItem.node, outOfOrderItem.node, order),
      });
    });
  } else {
    outOfOrder.forEach((outOfOrderItem) => {
      const order = 'before';
      const targetImportItem = findTargetImportItem(importedItems, outOfOrderItem);
      const message = createWarningMsg(targetImportItem, outOfOrderItem, order);

      context.report({
        node: outOfOrderItem.node,
        message,
        fix: fixOutOfOrder(sourceCode, targetImportItem.node, outOfOrderItem.node, order),
      });
    });
  }
}

/**
 * Construct and return the data structure
 * to store the node for each import along with its ranking
 * @param context - the context object
 * @param node - an AST node
 * @param name - the location of the import declaration
 * @param groupRanks - an object with group-rank pairs
 * @param importedItems - an array of import items
 */
function registerNode(context, node, name, groupRanks, importedItems) {
  const groupRank = groupRanks[importedGroups(name)];

  importedItems.push({
    name,
    groupRank,
    rank: groupRank, // Initially individual rank equals its group rank
    node,
  });
}

/**
 * Implement the auto-fix to remove blank lines
 * @param currentImportNode - the AST node for the second import declaration
 * @param prevImportNode - the AST node for the first import declaration
 * @returns the fixer object
 */
function removeBlankLines(context, currentImportNode, prevImportNode) {
  const sourceCode = context.getSourceCode();
  const rangeToRemove = prevImportNode
    ? [prevImportNode.end + 1, currentImportNode.start]
    : [0, currentImportNode.start];

  if (ALL_WHITESPACE.test(sourceCode.text.substring(rangeToRemove[0], rangeToRemove[1]))) {
    // Only remove them when the all lines between are blank lines
    return (fixer) => fixer.removeRange(rangeToRemove);
  }
  return undefined;
}

/**
 * Publish warnings and make fixes for proper line breaking
 * @param context - the context object
 * @param importedItems - an array of import items
 */
function reportAndFixBlankLines(context, importedItems) {
  const sourceCode = context.getSourceCode();
  importedItems.forEach((currentImport, index) => {
    const currentImportNode = currentImport.node;
    const commentsBeforeCurrentNode = sourceCode.getCommentsBefore(currentImportNode);
    if (index !== 0 && commentsBeforeCurrentNode.length === 0) {
      // Works only when there are no comments above non-initial imports
      const prevImportNode = importedItems[index - 1].node;
      const currentGroupRank = currentImport.groupRank;
      const PrevGroupRank = importedItems[index - 1].groupRank;
      const blankLinesBetween = getBlankLinesCount(context, prevImportNode, currentImportNode);

      if (prevImportNode.loc.end.line === currentImportNode.loc.start.line) {
        context.report({
          node: currentImportNode,
          message: 'Two imports cannot be on the same line',
          fix: addNewBlankLines(currentImportNode, prevImportNode),
        });
      } else if (currentGroupRank !== PrevGroupRank && blankLinesBetween === 0) {
        context.report({
          node: currentImportNode,
          message: 'There should be one blank line between import groups',
          fix: addNewBlankLines(currentImportNode, prevImportNode),
        });
      } else if (currentGroupRank !== PrevGroupRank && blankLinesBetween > 1) {
        context.report({
          node: currentImportNode,
          message: 'There should not be more than one blank line between import groups',
          fix: removeBlankLines(context, currentImportNode, prevImportNode),
        });
      } else if (currentGroupRank === PrevGroupRank && blankLinesBetween !== 0) {
        context.report({
          node: currentImportNode,
          message: 'There should be no blank lines within an import group',
          fix: removeBlankLines(context, currentImportNode, prevImportNode),
        });
      }
    } else if (index === 0 && commentsBeforeCurrentNode.length > 0) {
      // There are comments before the first import
      const lastCommentNode = _.last(commentsBeforeCurrentNode);
      if (lastCommentNode.loc.end.line + 1 === currentImportNode.loc.start.line) {
        // There are no one blank line between the first import and the comments above
        context.report({
          node: currentImportNode,
          message: 'There should be a blank line between the first import and comments ',
          fix: addNewBlankLines(currentImportNode, lastCommentNode),
        });
      } else if (lastCommentNode.loc.end.line + 2 < currentImportNode.loc.start.line) {
        // There are more than one blank line between the first import and the comments above
        context.report({
          node: currentImportNode,
          message: 'There can only be one blank line between the first import and comments',
          fix: removeBlankLines(context, currentImportNode, lastCommentNode),
        });
      }
    } else if (index === 0 && currentImportNode.loc.start.line !== 1) {
      // There are blank lines before the first import when there are no comments before
      context.report({
        node: currentImportNode,
        message: 'There should not be any blank lines before the first import',
        fix: removeBlankLines(context, currentImportNode),
      });
    }
  });
}

module.exports = {
  meta: {
    docs: {},
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          groups: {
            type: 'array',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create: function importOrderRule(context) {
    const options = context.options[0] || {};
    const groups = options.groups || DEFAULT_GROUPS;
    let importedItems = [];

    try {
      isGroupOfUnknownType(groups);
      isGroupDuplicate(groups);
    } catch (error) {
      // Malformed configuration
      return {
        Program(node) {
          context.report(node, error.message);
        },
      };
    }

    const groupRanks = getGroupRanks(groups);

    return {
      ImportDeclaration: function handleimportedItems(node) {
        const name = node.source.value;
        registerNode(context, node, name, groupRanks, importedItems);
      },
      'Program:exit': function reportAndReset() {
        alphabetizeIndividualRanks(importedItems);
        reportAndFixBlankLines(context, importedItems);
        reportAndFixOutOfOrder(context, importedItems);

        importedItems = [];
      },
    };
  },
};
