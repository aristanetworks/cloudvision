# arista/import-order: Enforce Arista conventions for module imports

Enforce a convention in the order of `import` statements.
The `--fix` option (on the command line) automatically fixes problems reported by this rule.

The order is as shown in the following example:

```js
// 1. external npm packages
import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

// 2.internal npm packages
import { NOTIF_TYPES } from '@arista/aeris-connector';
import { createReducer } from '@arista/redux-typed-reducer';

// 3.anything from the “framework” (geiger-* or modules/main)
import MediaObj from 'geiger-components/MediaObj';
import { formatEventTimestamp } from 'geiger-utils/formatTime';

// 4.local imports from other directories in “this” module
import EventListItem from 'modules/events/components/EventListItem';

// 5.local imports from the parent directory
import DataTable from '..';
import { BATCHED_DATA } from '../constants';

// 6.local imports from the current directory
import dataGenerator from './dataGenerator';
import { devices } from './devices';

// 7.the local stylesheet
import './styles.less';

```
When importing modules and Flow types from the same file, always import modules first, then Flow types second:
```js
import { getDeviceLabel } from './deviceUtils';
import type { DeviceObject } from './deviceUtils';
```

There should be one blank line between every group, also no blank lines allowed within groups.

If there are comments above the first import, there should be one blank line between the last comment and
the first import.

If there are no comments above imports, the first import should start on the first line.

Currently this rule does not support enforcing proper line breaking for mixing imports with comments
i.e. adding comments **above** non-initial imports

## Options

This rule supports the customized group options:

### `groups: [array]`:
How groups are defined, and the order to respect.
`groups` must be an array of `string` or [`string`].
The only allowed `string`s are: `"internal"`, `"external"`, `"geiger"`, `"main"`, `"module"`, `"parentDirectory"`, `"currentDirectory"`, `"stylesheet"`.
The enforced order is the same as the order of each element in a group.
The default groups is `["external", "internal", ["geiger", "main"], "module", "parentDirectory", "currentDirectory", "stylesheet"]`.
You can set the options like this:
```js
{
  'arista/import-order': ['error', {
    groups: [
      'external',
      'internal',
      ['geiger', 'main'],
      'module',
      'parentDirectory',
      'currentDirectory',
      'stylesheet'
    ]
  }]
}
```
