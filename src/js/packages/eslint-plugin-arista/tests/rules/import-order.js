const RuleTester = require('eslint').RuleTester;
const rule = require('../../src/rules/import-order');

const parser = require.resolve('babel-eslint');
const ruleTester = new RuleTester();
const FILENAME = '';

function test(t) {
  return Object.assign(
    {
      filename: FILENAME,
    },
    t,
    {
      parserOptions: Object.assign(
        {
          sourceType: 'module',
          ecmaVersion: 6,
        },
        t.parserOptions,
      ),
    },
  );
}

ruleTester.run('order', rule, {
  // Valid test cases
  valid: [
    test({
      // Testing external npm packages
      code:
        "import _ from 'lodash';\n" +
        "import PropTypes from 'prop-types';\n" +
        "import React, { Component } from 'react';\n" +
        "import { Button, Modal } from 'react-bootstrap';",
    }),
    test({
      // Testing internal npm packages
      code:
        "import { NOTIF_TYPES } from '@arista/aeris-connector';\n" +
        "import { createReducer } from '@arista/redux-typed-reducer';",
    }),
    test({
      // Testing webpack alias i.e. geiger-* and modules/main
      code:
        "import MediaObj from 'geiger-components/MediaObj';\n" +
        "import { formatEventTimestamp } from 'geiger-utils/formatTime';",
    }),
    test({
      // Testing more webpack alias i.e. geiger-* and modules/main
      code:
        "import DataTable from 'geiger-components/DataTable';\n" +
        "import RelatedLinks from 'geiger-components/RelatedLinks';\n" +
        "import { subscribe } from 'geiger-components/Subscribe';\n" +
        "import { POINT_IN_TIME } from 'geiger-components/Subscribe/constants';\n" +
        "import Timestamp from 'geiger-components/Timestamp';\n" +
        'import { blank_ARRAY, NO_DATA_MSG, COL_SORT_DIR, LIVE_TIME } ' +
        "from 'geiger-constants';\n" +
        "import { DEVICE_SNAPSHOT_LIST } from 'geiger-metrics';\n" +
        "import * as GeigerPropTypes from 'geiger-prop-types';\n" +
        "import { formatFullDateTime } from 'geiger-utils/formatTime';\n" +
        "import { selectors as MainSelectors } from 'modules/main';",
    }),
    test({
      // Testing local imports from other directories in 'this' module
      code:
        "import EventListItem from 'modules/events/components/EventListItem';\n" +
        "import * as DeviceSelectors from 'modules/events/selectors';",
    }),
    test({
      // Testing more local imports from other directories in 'this' module
      code:
        "import Card from 'modules/events/containers/Card';\n" +
        "import Header from 'modules/events/containers/Header';\n" +
        "import Sidebar from 'modules/events/containers/Sidebar';\n" +
        "import * as EventSelectors from 'modules/events/selectors';\n" +
        'import {\n' +
        '  didEventChange,\n' +
        '  getEventSourceName,\n' +
        '  getEventTurbineId,\n' +
        '  setEventAndTimeWindow,\n' +
        '  filterEvents,\n' +
        "} from 'modules/events/utils';",
    }),
    test({
      // Testing local imports from the parent directory
      code: "import DataTable from '..';\nimport { BATCHED_DATA } from '../constants';",
    }),
    test({
      // Testing more local imports from the parent directory
      code:
        "import { setData } from '../../utils';\n" +
        'import { generateCategoricalData, generatePathPointerData } ' +
        "from '../../utils/dataUtils';\n" +
        'import {\n' +
        '  randomArrayItem,\n' +
        '  randomIntRange,\n' +
        '  randomIPv4Address,\n' +
        '  randomMacAddress,\n' +
        "} from '../../utils/randomUtils';",
    }),
    test({
      // Testing local imports from the current directory
      code: "import dataGenerator from './dataGenerator';\nimport { devices } from './devices';",
    }),
    test({
      // Testing more local imports from the current directory
      code:
        "import DevicesColumn from './DevicesColumn';\n" +
        "import InputModal from './InputModal';\n" +
        "import PreviewAndSaveModal from './PreviewAndSaveModal';\n" +
        "import RemoveModal from './RemoveModal';\n" +
        "import TagsColumn from './TagsColumn';\n" +
        'import {\n' +
        '  getChanges,\n' +
        '  getNumChanges,\n' +
        '  isDevicesSelected,\n' +
        '  prepareChanges,\n' +
        '  processDevices,\n' +
        "} from './utils';",
    }),
    test({
      // Testing imports from multiple different groups
      code:
        "import PropTypes from 'prop-types';\n" +
        '\n' +
        "import EventListItem from 'modules/events/components/EventListItem';\n" +
        '\n' +
        "import { BATCHED_DATA } from '../constants';\n",
    }),
    test({
      // Testing imports containing FlowType
      code:
        "import EventListItem from 'modules/events/components/EventListItem';\n" +
        "import type { EventListItemType } from 'modules/events/components/EventListItem';\n" +
        "import * as DeviceSelectors from 'modules/events/selectors';",
      parser,
    }),
  ],
  // Invalid test cases
  invalid: [
    // Testing publishing warnings i.e. the problem message
    test({
      // Testing out of order imports of external npm packages
      code:
        "import PropTypes from 'prop-types';\n" +
        "import moment from 'moment';\n" +
        "import _ from 'lodash';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'moment' import should occur before 'prop-types' import",
        },
        {
          ruleId: 'order',
          message: "'lodash' import should occur before 'prop-types' import",
        },
      ],
    }),
    test({
      // Testing out of order imports with improper line breaking of external npm packages
      code:
        "import moment from 'moment';\n" +
        "import _ from 'lodash';\n" +
        '\n' +
        "import PropTypes from 'prop-types';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'lodash' import should occur before 'moment' import",
        },
        {
          ruleId: 'order',
          message: 'There should be no blank lines within an import group',
        },
      ],
    }),
    test({
      // Testing out of order imports from two different groups
      code:
        "import { NOTIF_TYPES } from '@arista/aeris-connector';\n" +
        "import { createReducer } from '@arista/redux-typed-reducer';\n" +
        '\n' +
        "import PropTypes from 'prop-types';\n" +
        "import React from 'react';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'prop-types' import should occur before '@arista/aeris-connector' import",
        },
        {
          ruleId: 'order',
          message: "'react' import should occur before '@arista/aeris-connector' import",
        },
      ],
    }),
    test({
      // Testing out of order imports from two different groups with improper line breaking
      code:
        "import { NOTIF_TYPES } from '@arista/aeris-connector';\n" +
        '\n' +
        "import { createReducer } from '@arista/redux-typed-reducer';\n" +
        "import PropTypes from 'prop-types';\n" +
        "import React from 'react';\n",
      errors: [
        {
          ruleId: 'order',
          message: 'There should be no blank lines within an import group',
        },
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
        {
          ruleId: 'order',
          message: "'prop-types' import should occur before '@arista/aeris-connector' import",
        },
        {
          ruleId: 'order',
          message: "'react' import should occur before '@arista/aeris-connector' import",
        },
      ],
    }),
    test({
      // Testing out of order imports from multiple different groups with improper line breaking
      code:
        "import './styles.less';\n" +
        '\n' +
        '\n' +
        '\n' +
        "import PropTypes from 'prop-types';import { devices } from './devices';\n" +
        "import React from 'react';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'./styles.less' import should occur after 'react' import",
        },
        {
          ruleId: 'order',
          message: 'There should not be more than one blank line between import groups',
        },
        {
          ruleId: 'order',
          message: 'Two imports cannot be on the same line',
        },
        {
          ruleId: 'order',
          message: "'./devices' import should occur after 'react' import",
        },
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
      ],
    }),
    test({
      // Testing imports from multiple different groups with improper line breaking
      code:
        '\n' +
        '\n' +
        '\n' +
        "import PropTypes from 'prop-types';\n" +
        "import EventListItem from 'modules/events/components/EventListItem';\n" +
        "import { BATCHED_DATA } from '../constants';\n",
      errors: [
        {
          ruleId: 'order',
          message: 'There should not be any blank lines before the first import',
        },
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
      ],
    }),
    test({
      // Testing imports containing FlowTypes
      code:
        "import type { LiveTime } from 'geiger-constants';\n" +
        "import { EMPTY_ARRAY, UNKNOWN_MSG } from 'geiger-constants';\n" +
        "import { NUMERIC_DATA } from 'geiger-data-paths/constants';\n",
      parser,
      errors: [
        {
          ruleId: 'order',
          message: "'geiger-constants' import should occur before 'geiger-constants' import type",
        },
      ],
    }),
    // Testing auto-fix
    test({
      // Testing the auto-fix of alphabetizing the imports of the external packages
      code:
        "import PropTypes from 'prop-types';\n" +
        "import _ from 'lodash';\n" +
        "import moment from 'moment';\n",
      output:
        "import _ from 'lodash';\n" +
        "import moment from 'moment';\n" +
        "import PropTypes from 'prop-types';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'prop-types' import should occur after 'moment' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of alphabetizing the imports of the external packages
      code:
        "import moment from 'moment';\n" +
        "import _ from 'lodash';\n" +
        "import PropTypes from 'prop-types';\n",
      output:
        "import _ from 'lodash';\n" +
        "import moment from 'moment';\n" +
        "import PropTypes from 'prop-types';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'lodash' import should occur before 'moment' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of alphabetizing the imports of the internal packages
      code:
        "import { createReducer } from '@arista/redux-typed-reducer';\n" +
        "import { NOTIF_TYPES } from '@arista/aeris-connector';\n",
      output:
        "import { NOTIF_TYPES } from '@arista/aeris-connector';\n" +
        "import { createReducer } from '@arista/redux-typed-reducer';\n",
      errors: [
        {
          ruleId: 'order',
          message:
            "'@arista/aeris-connector' import should occur " +
            "before '@arista/redux-typed-reducer' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of alphabetizing the imports of the internal packages
      code:
        "import { fromBinaryKey } from '@arista/cloudvision-connector';\n" +
        "import { createReducer } from '@arista/redux-typed-reducer';\n" +
        "import { actions as moduleParamsActions } from '@arista/redux-module-params';\n",
      output:
        "import { fromBinaryKey } from '@arista/cloudvision-connector';\n" +
        'import { actions as moduleParamsActions } from ' +
        "'@arista/redux-module-params';\n" +
        "import { createReducer } from '@arista/redux-typed-reducer';\n",
      errors: [
        {
          ruleId: 'order',
          message:
            "'@arista/redux-module-params' import should occur " +
            "before '@arista/redux-typed-reducer' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of alphabetizing the imports of
      // the webpack alias i.e. geiger-* and modules/main
      code:
        "import { confirm } from 'geiger-components/Confirm';\n" +
        "import disableIfReadOnly from 'geiger-components/disableIfReadOnly';\n" +
        "import TableOverflowStyler from 'geiger-components/TableOverflowStyler';\n" +
        "import withPermissions from 'geiger-components/withPermissions';\n" +
        "import { PERMISSIONS } from 'geiger-constants';\n" +
        'import { SNAPSHOT_CONFIG_PATH, SNAPSHOT_CONFIG_UIDS_PATH } ' +
        "from 'geiger-data-paths';\n" +
        "import { CVP_DATASETID } from 'geiger-metrics/constants';\n" +
        "import * as GeigerPropTypes from 'geiger-prop-types';\n" +
        "import { makeNoAccessMessage } from 'geiger-utils/permissionsUtils';\n" +
        "import SnapshotConfigTable from 'geiger-views/SnapshotConfigTable';\n" +
        "import { selectors as MainSelectors } from 'modules/main';\n",
      output:
        "import { confirm } from 'geiger-components/Confirm';\n" +
        "import TableOverflowStyler from 'geiger-components/TableOverflowStyler';\n" +
        "import disableIfReadOnly from 'geiger-components/disableIfReadOnly';\n" +
        "import withPermissions from 'geiger-components/withPermissions';\n" +
        "import { PERMISSIONS } from 'geiger-constants';\n" +
        'import { SNAPSHOT_CONFIG_PATH, SNAPSHOT_CONFIG_UIDS_PATH } from ' +
        "'geiger-data-paths';\n" +
        "import { CVP_DATASETID } from 'geiger-metrics/constants';\n" +
        "import * as GeigerPropTypes from 'geiger-prop-types';\n" +
        "import { makeNoAccessMessage } from 'geiger-utils/permissionsUtils';\n" +
        "import SnapshotConfigTable from 'geiger-views/SnapshotConfigTable';\n" +
        "import { selectors as MainSelectors } from 'modules/main';\n",
      errors: [
        {
          ruleId: 'order',
          message:
            "'geiger-components/TableOverflowStyler' import should occur " +
            "before 'geiger-components/disableIfReadOnly' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of alphabetizing local imports from other directories in the module
      code:
        "import { isPointInTimeEvent } from 'modules/events/utils';\n" +
        "import DurationMessage from 'modules/events/components/DurationMessage';\n",
      output:
        "import DurationMessage from 'modules/events/components/DurationMessage';\n" +
        "import { isPointInTimeEvent } from 'modules/events/utils';\n",
      errors: [
        {
          ruleId: 'order',
          message:
            "'modules/events/components/DurationMessage' import should " +
            "occur before 'modules/events/utils' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of scoped external packages
      code:
        "import PropTypes from 'prop-types';\n" +
        "import React from 'react';\n" +
        'import { Histogram as DataUiHistogram, BarSeries, XAxis, YAxis } ' +
        "from '@data-ui/histogram';\n",
      output:
        'import { Histogram as DataUiHistogram, BarSeries, XAxis, YAxis } ' +
        "from '@data-ui/histogram';\n" +
        "import PropTypes from 'prop-types';\n" +
        "import React from 'react';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'@data-ui/histogram' import should occur before 'prop-types' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of alphabetizing local imports from the current directory
      code:
        'import {\n' +
        '  CREATE,\n' +
        '  DEFAULT,\n' +
        "} from './constants';\n" +
        "import TagNameAndValue from './TagNameAndValue';\n",
      output:
        "import TagNameAndValue from './TagNameAndValue';\n" +
        'import {\n' +
        '  CREATE,\n' +
        '  DEFAULT,\n' +
        "} from './constants';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'./TagNameAndValue' import should occur before './constants' import",
        },
      ],
    }),
    test({
      // Testing the auto-fix of making proper line breaking
      code:
        "import PropTypes from 'prop-types';\n" +
        "import EventListItem from 'modules/events/components/EventListItem';\n" +
        "import { BATCHED_DATA } from '../constants';\n",
      output:
        "import PropTypes from 'prop-types';\n" +
        '\n' +
        "import EventListItem from 'modules/events/components/EventListItem';\n" +
        '\n' +
        "import { BATCHED_DATA } from '../constants';\n",
      errors: [
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
      ],
    }),
    test({
      // Testing the auto-fix of making proper line breaking
      code:
        "import { error } from 'geiger-utils/logger';\n" +
        '\n' +
        'import { createNewTagAndValue, createTagValue } from ' +
        "'geiger-utils/publish/tagUtils';\n" +
        "import TagNameAndValue from './TagNameAndValue';\n" +
        "import { getAllTagTypes, getStaticTagTypes } from './utils';\n",
      output:
        "import { error } from 'geiger-utils/logger';\n" +
        'import { createNewTagAndValue, createTagValue } from ' +
        "'geiger-utils/publish/tagUtils';\n" +
        '\n' +
        "import TagNameAndValue from './TagNameAndValue';\n" +
        "import { getAllTagTypes, getStaticTagTypes } from './utils';\n",
      errors: [
        {
          ruleId: 'order',
          message: 'There should be no blank lines within an import group',
        },
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
      ],
    }),
    test({
      // Testing the auto-fix of making proper line breaking
      code:
        '\n' +
        '\n' +
        '\n' +
        '\n' +
        '\n' +
        "import _ from 'lodash';\n" +
        "import moment from 'moment';\n" +
        "import PropTypes from 'prop-types';\n" +
        "import React from 'react';\n" +
        "import { NOTIF_TYPES } from '@arista/aeris-connector';\n" +
        "import { createReducer } from '@arista/redux-typed-reducer';\n",
      output:
        "import _ from 'lodash';\n" +
        "import moment from 'moment';\n" +
        "import PropTypes from 'prop-types';\n" +
        "import React from 'react';\n" +
        '\n' +
        "import { NOTIF_TYPES } from '@arista/aeris-connector';\n" +
        "import { createReducer } from '@arista/redux-typed-reducer';\n",
      errors: [
        {
          ruleId: 'order',
          message: 'There should not be any blank lines before the first import',
        },
        {
          ruleId: 'order',
          message: 'There should be one blank line between import groups',
        },
      ],
    }),
    test({
      // Testing imports containing FlowTypes
      code:
        "import type { LiveTime } from 'geiger-constants';\n" +
        "import { EMPTY_ARRAY, UNKNOWN_MSG } from 'geiger-constants';\n" +
        "import { NUMERIC_DATA } from 'geiger-data-paths/constants';\n",
      parser,
      output:
        "import { EMPTY_ARRAY, UNKNOWN_MSG } from 'geiger-constants';\n" +
        "import type { LiveTime } from 'geiger-constants';\n" +
        "import { NUMERIC_DATA } from 'geiger-data-paths/constants';\n",
      errors: [
        {
          ruleId: 'order',
          message: "'geiger-constants' import should occur before 'geiger-constants' import type",
        },
      ],
    }),
  ],
});
