// Constants for message types and actions

const MESSAGE_TYPES = {
    // Component.js (window) messages
    GET_USER_ID: 'SABKI_SOCH_GET_USER_ID',
    GET_CONTEXTS: 'SABKI_SOCH_GET_CONTEXTS',
    ACTION: 'SABKI_SOCH_ACTION',

    // Responses
    USER_ID_RESPONSE: 'SABKI_SOCH_USER_ID_RESPONSE',
    CONTEXTS_RESPONSE: 'SABKI_SOCH_CONTEXTS_RESPONSE',
    RESPONSE: 'SABKI_SOCH_RESPONSE',

    // Injected.js messages
    FROM_SABKI_SOCH: 'sabki_soch'
};

const ACTIONS = {
    STORE_CONTEXT: 'store_context',
    LOAD_CONTEXT: 'load_context',
    LOAD_CONTEXT_BY_ID: 'load_context_by_id',
    CLEAR_DATA: 'clear_data',
    INJECT_CONTEXT: 'inject_context',
    DELETE_CONTEXT: 'delete_context'
};

const CHROME_RUNTIME_ACTIONS = {
    PAGE_API_DATA: 'page_api_data'
};

