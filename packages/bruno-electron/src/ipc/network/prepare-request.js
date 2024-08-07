const os = require('os');
const { get, each, filter, extend, compact } = require('lodash');
const decomment = require('decomment');
var JSONbig = require('json-bigint');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { getTreePathFromCollectionToItem } = require('../../utils/collection');

const mergeHeaders = (collection, request, requestTreePath) => {
  let headers = new Map();
  each(get(collection, 'root.request.headers', []), (h) => {
    if (h.enabled && h.name.length > 0) {
      headers.set(h.name, { value: h.value });
      if (h.name.toLowerCase() === 'content-type') {
        contentTypeDefined = true;
      }
    }
  });
  for (let i of requestTreePath) {
    if (i.type === 'folder') {
      let _headers = get(i, 'root.request.headers', []);
      _headers.forEach((header) => {
        if (header.enabled) {
          headers.set(header.name, { value: header.value, uid: i?.uid });
        }
      });
    } else {
      let _headers = get(i, 'request.headers', []);
      _headers.forEach((header) => {
        if (header.enabled) {
          headers.set(header.name, { value: header.value });
        }
      });
    }
  }

  request.headers = Array.from(headers, ([name, _value]) => ({
    name,
    value: _value?.value,
    enabled: true,
    ...(_value?.uid ? { uid: _value?.uid } : {})
  }));

};

const mergeVars = (collection, request, requestTreePath) => {
  let reqVars = new Map();
  let collectionRequestVars = get(collection, 'root.request.vars.req', []);
  collectionRequestVars.forEach((_var) => {
    if (_var.enabled) {
      reqVars.set(_var.name, _var.value);
    }
  });
  for (let i of requestTreePath) {
    if (i.type === 'folder') {
      let vars = get(i, 'root.request.vars.req', []);
      vars.forEach((_var) => {
        if (_var.enabled) {
          reqVars.set(_var.name, _var.value);
        }
      });
    } else {
      let vars = get(i, 'request.vars.req', []);
      vars.forEach((_var) => {
        if (_var.enabled) {
          reqVars.set(_var.name, _var.value);
        }
      });
    }
  }
  request.vars.req = Array.from(reqVars, ([name, value]) => ({
    name,
    value,
    enabled: true,
    type: 'request'
  }));

  let resVars = new Map();
  let collectionResponseVars = get(collection, 'root.request.vars.res', []);
  collectionResponseVars.forEach((_var) => {
    if (_var.enabled) {
      resVars.set(_var.name, _var.value);
    }
  });
  for (let i of requestTreePath) {
    if (i.type === 'folder') {
      let vars = get(i, 'root.request.vars.res', []);
      vars.forEach((_var) => {
        if (_var.enabled) {
          resVars.set(_var.name, _var.value);
        }
      });
    } else {
      let vars = get(i, 'request.vars.res', []);
      vars.forEach((_var) => {
        if (_var.enabled) {
          resVars.set(_var.name, _var.value);
        }
      });
    }
  }
  request.vars.res = Array.from(resVars, ([name, value]) => ({
    name,
    value,
    enabled: true,
    type: 'response'
  }));

  // ---------------------------------------------------------------
  let collectionVariables = [];
  let folderVariables = [];
  let requestVariables = [];
  collectionVariables = collectionRequestVars.filter((v) => v?.enabled);

  for (let i of requestTreePath) {
    if (i.type === 'folder') {
      let _folderVariables = [];
      let folderRequestVars = get(i, 'root.request.vars.req', []);
      _folderVariables = folderRequestVars.filter((v) => v?.enabled);
      folderVariables.push(_folderVariables);
    } else {
      let rRequestVars = get(i, 'request.vars.req', []);
      requestVariables = rRequestVars?.filter((v) => v?.enabled);
    }
  }
  // ---------------------------------------------------------------

  request.collectionVariables = collectionVariables;
  request.folderVariables = folderVariables;
  request.requestVariables = requestVariables;
};

const mergeScripts = (collection, request, requestTreePath) => {
  let combinedPreReqScript = [];
  let combinedPostResScript = [];
  let combinedTests = [];

  let collectionPreReqScript = get(collection, 'root.request.script.req', '// placeholder pre-request script - collection');
  combinedPreReqScript.push(collectionPreReqScript);
  let collectionPostResScript = get(collection, 'root.request.script.res', '// placeholder post-response script - collection');
  combinedPostResScript.push(collectionPostResScript);
  let collectionTests = get(collection, 'root.request.tests', '// placeholder  tests - collection');
  combinedTests.push(collectionTests);

  for (let i of requestTreePath) {
    if (i.type === 'folder') {
      let preReqScript = get(i, 'root.request.script.req', `// placeholder pre-request script - folder`);
      if (preReqScript && preReqScript.trim() !== '') {
        combinedPreReqScript.push(preReqScript);
      }

      let postResScript = get(i, 'root.request.script.res', `// placeholder post-response script - folder`);
      if (postResScript && postResScript.trim() !== '') {
        combinedPostResScript.push(postResScript);
      }

      let tests = get(i, 'root.request.tests', '// placeholder tests - request');
      if (tests && tests?.trim?.() !== '') {
        combinedTests.push(tests);
      }
    }
  }

  // inject the uid for requestTreePathCalc and getAllVariables for bru.getFolderVar
  if (combinedPreReqScript.length) {
    request.script.req = [...combinedPreReqScript, request?.script?.req || '// placeholder pre-request script - request'];
  }

  if (combinedPostResScript.length) {
    request.script.res = [request?.script?.res || '// placeholder post-response script - request', ...combinedPostResScript.reverse()];
  }

  if (combinedTests.length) {
    request.tests = compact([request?.tests || 'placeholder tests - request', ...combinedTests.reverse()]).join(os.EOL);
  }
};

const parseFormData = (datas, collectionPath) => {
  // make axios work in node using form data
  // reference: https://github.com/axios/axios/issues/1006#issuecomment-320165427
  const form = new FormData();
  datas.forEach((item) => {
    const value = item.value;
    const name = item.name;
    if (item.type === 'file') {
      const filePaths = value || [];
      filePaths.forEach((filePath) => {
        let trimmedFilePath = filePath.trim();

        if (!path.isAbsolute(trimmedFilePath)) {
          trimmedFilePath = path.join(collectionPath, trimmedFilePath);
        }

        form.append(name, fs.createReadStream(trimmedFilePath), path.basename(trimmedFilePath));
      });
    } else {
      form.append(name, value);
    }
  });
  return form;
};

const setAuthHeaders = (axiosRequest, request, collectionRoot) => {
  const collectionAuth = get(collectionRoot, 'request.auth');
  if (collectionAuth && request.auth.mode === 'inherit') {
    switch (collectionAuth.mode) {
      case 'awsv4':
        axiosRequest.awsv4config = {
          accessKeyId: get(collectionAuth, 'awsv4.accessKeyId'),
          secretAccessKey: get(collectionAuth, 'awsv4.secretAccessKey'),
          sessionToken: get(collectionAuth, 'awsv4.sessionToken'),
          service: get(collectionAuth, 'awsv4.service'),
          region: get(collectionAuth, 'awsv4.region'),
          profileName: get(collectionAuth, 'awsv4.profileName')
        };
        break;
      case 'basic':
        axiosRequest.auth = {
          username: get(collectionAuth, 'basic.username'),
          password: get(collectionAuth, 'basic.password')
        };
        break;
      case 'bearer':
        axiosRequest.headers['Authorization'] = `Bearer ${get(collectionAuth, 'bearer.token')}`;
        break;
      case 'digest':
        axiosRequest.digestConfig = {
          username: get(collectionAuth, 'digest.username'),
          password: get(collectionAuth, 'digest.password')
        };
        break;
    }
  }

  if (request.auth) {
    switch (request.auth.mode) {
      case 'awsv4':
        axiosRequest.awsv4config = {
          accessKeyId: get(request, 'auth.awsv4.accessKeyId'),
          secretAccessKey: get(request, 'auth.awsv4.secretAccessKey'),
          sessionToken: get(request, 'auth.awsv4.sessionToken'),
          service: get(request, 'auth.awsv4.service'),
          region: get(request, 'auth.awsv4.region'),
          profileName: get(request, 'auth.awsv4.profileName')
        };
        break;
      case 'basic':
        axiosRequest.auth = {
          username: get(request, 'auth.basic.username'),
          password: get(request, 'auth.basic.password')
        };
        break;
      case 'bearer':
        axiosRequest.headers['Authorization'] = `Bearer ${get(request, 'auth.bearer.token')}`;
        break;
      case 'digest':
        axiosRequest.digestConfig = {
          username: get(request, 'auth.digest.username'),
          password: get(request, 'auth.digest.password')
        };
        break;
      case 'oauth2':
        const grantType = get(request, 'auth.oauth2.grantType');
        switch (grantType) {
          case 'password':
            axiosRequest.oauth2 = {
              grantType: grantType,
              accessTokenUrl: get(request, 'auth.oauth2.accessTokenUrl'),
              username: get(request, 'auth.oauth2.username'),
              password: get(request, 'auth.oauth2.password'),
              clientId: get(request, 'auth.oauth2.clientId'),
              clientSecret: get(request, 'auth.oauth2.clientSecret'),
              scope: get(request, 'auth.oauth2.scope')
            };
            break;
          case 'authorization_code':
            axiosRequest.oauth2 = {
              grantType: grantType,
              callbackUrl: get(request, 'auth.oauth2.callbackUrl'),
              authorizationUrl: get(request, 'auth.oauth2.authorizationUrl'),
              accessTokenUrl: get(request, 'auth.oauth2.accessTokenUrl'),
              clientId: get(request, 'auth.oauth2.clientId'),
              clientSecret: get(request, 'auth.oauth2.clientSecret'),
              scope: get(request, 'auth.oauth2.scope'),
              state: get(request, 'auth.oauth2.state'),
              pkce: get(request, 'auth.oauth2.pkce')
            };
            break;
          case 'client_credentials':
            axiosRequest.oauth2 = {
              grantType: grantType,
              accessTokenUrl: get(request, 'auth.oauth2.accessTokenUrl'),
              clientId: get(request, 'auth.oauth2.clientId'),
              clientSecret: get(request, 'auth.oauth2.clientSecret'),
              scope: get(request, 'auth.oauth2.scope')
            };
            break;
        }
        break;
    }
  }

  return axiosRequest;
};

const prepareRequest = (item, collection) => {
  const request = item.draft ? item.draft.request : item.request;
  const collectionRoot = get(collection, 'root', {});
  const collectionPath = collection.pathname;
  const headers = {};
  let contentTypeDefined = false;
  let url = request.url;

  const requestTreePath = getTreePathFromCollectionToItem(collection, item);
  if (requestTreePath && requestTreePath.length > 0) {
    mergeHeaders(collection, request, requestTreePath);
    mergeScripts(collection, request, requestTreePath);
    mergeVars(collection, request, requestTreePath);
  }

  each(request.headers, (h) => {
    if (h.enabled && h.name.length > 0) {
      headers[h.name] = h.value;
      if (h.name.toLowerCase() === 'content-type') {
        contentTypeDefined = true;
      }
    }
  });

  let axiosRequest = {
    mode: request.body.mode,
    method: request.method,
    url,
    headers,
    headersWithDetails: request.headers,
    pathParams: request?.params?.filter((param) => param.type === 'path'),
    responseType: 'arraybuffer'
  };

  axiosRequest = setAuthHeaders(axiosRequest, request, collectionRoot);

  if (request.body.mode === 'json') {
    if (!contentTypeDefined) {
      axiosRequest.headers['content-type'] = 'application/json';
    }
    let jsonBody;
    try {
      jsonBody = decomment(request?.body?.json);
    } catch (error) {
      jsonBody = request?.body?.json;
    }
    try {
      axiosRequest.data = JSONbig.parse(jsonBody);
    } catch (error) {
      axiosRequest.data = jsonBody;
    }
  }

  if (request.body.mode === 'text') {
    if (!contentTypeDefined) {
      axiosRequest.headers['content-type'] = 'text/plain';
    }
    axiosRequest.data = request.body.text;
  }

  if (request.body.mode === 'xml') {
    if (!contentTypeDefined) {
      axiosRequest.headers['content-type'] = 'text/xml';
    }
    axiosRequest.data = request.body.xml;
  }

  if (request.body.mode === 'sparql') {
    if (!contentTypeDefined) {
      axiosRequest.headers['content-type'] = 'application/sparql-query';
    }
    axiosRequest.data = request.body.sparql;
  }

  if (request.body.mode === 'formUrlEncoded') {
    axiosRequest.headers['content-type'] = 'application/x-www-form-urlencoded';
    const params = {};
    const enabledParams = filter(request.body.formUrlEncoded, (p) => p.enabled);
    each(enabledParams, (p) => (params[p.name] = p.value));
    axiosRequest.data = params;
  }

  if (request.body.mode === 'multipartForm') {
    const enabledParams = filter(request.body.multipartForm, (p) => p.enabled);
    const form = parseFormData(enabledParams, collectionPath);
    extend(axiosRequest.headers, form.getHeaders());
    axiosRequest.data = form;
  }

  if (request.body.mode === 'graphql') {
    const graphqlQuery = {
      query: get(request, 'body.graphql.query'),
      // https://github.com/usebruno/bruno/issues/884 - we must only parse the variables after the variable interpolation
      variables: decomment(get(request, 'body.graphql.variables') || '{}')
    };
    if (!contentTypeDefined) {
      axiosRequest.headers['content-type'] = 'application/json';
    }
    axiosRequest.data = graphqlQuery;
  }

  if (request.script) {
    axiosRequest.script = request.script;
  }

  axiosRequest.vars = request.vars;
  axiosRequest.requestVariables = request.requestVariables;
  axiosRequest.folderVariables = request.folderVariables;
  axiosRequest.collectionVariables = request.collectionVariables;
  axiosRequest.assertions = request.assertions;

  return axiosRequest;
};

module.exports = prepareRequest;
module.exports.setAuthHeaders = setAuthHeaders;
