import { DatasetCommand, DatasetTypes, GetCommands, SearchType, StreamCommands, WsCommand } from '../types/params';
export declare const EOF = "EOF";
/**
 * Status code for EOF (End Of File).
 */
export declare const EOF_CODE = 1001;
/**
 * Status code for Active (when a subscription has been created and is active).
 */
export declare const ACTIVE_CODE = 3001;
/**
 * Status code for Paused (when the incoming results for a request have been paused).
 */
export declare const PAUSED_CODE = 1002;
/**
 * Error status sent when a request has finished streaming data.
 */
export declare const RESPONSE_COMPLETED = "RESPONSE_COMPLETED";
export declare const CLOSE: WsCommand;
export declare const DEVICES_DATASET_ID: DatasetCommand;
export declare const GET: GetCommands;
export declare const GET_DATASETS: GetCommands;
export declare const PAUSE: WsCommand;
export declare const PUBLISH: WsCommand;
export declare const RESUME: WsCommand;
export declare const SUBSCRIBE: StreamCommands;
export declare const SEARCH: GetCommands;
export declare const SEARCH_SUBSCRIBE: StreamCommands;
export declare const SERVICE_REQUEST: WsCommand;
export declare const APP_DATASET_TYPE: DatasetTypes;
export declare const DEVICE_DATASET_TYPE: DatasetTypes;
export declare const SEARCH_TYPE_ANY: SearchType;
export declare const SEARCH_TYPE_IP: SearchType;
export declare const SEARCH_TYPE_MAC: SearchType;
export declare const ALL_SEARCH_TYPES: Set<string>;
export declare const CONNECTED = "connected";
export declare const DISCONNECTED = "disconnected";
