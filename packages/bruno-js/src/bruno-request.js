class BrunoRequest {
  constructor(req) {
    this.req = req;
    this.url = req.url;
    this.method = req.method;
    this.headers = req.headers;
    this.body = req.data;
    this.timeout = req.timeout;
  }

  getUrl() {
    return this.req.url;
  }

  setUrl(url) {
    this.req.url = url;
  }

  getMethod() {
    return this.req.method;
  }

  getAuthMode() {
    if (this.req?.oauth2) {
      return 'oauth2';
    } else if (this.headers?.['Authorization']?.startsWith('Bearer')) {
      return 'bearer';
    } else if (this.headers?.['Authorization']?.startsWith('Basic') || this.req?.auth?.username) {
      return 'basic';
    } else if (this.req?.awsv4) {
      return 'awsv4';
    } else if (this.req?.digestConfig) {
      return 'digest';
    } else {
      return 'none';
    }
  }

  setMethod(method) {
    this.req.method = method;
  }

  getHeaders() {
    return this.req.headers;
  }

  setHeaders(headers) {
    this.req.headers = headers;
  }

  getHeader(name) {
    return this.req.headers[name];
  }

  setHeader(name, value) {
    this.req.headers[name] = value;
  }

  /**
   * Get the body of the request
   * 
   * @param {*} options 
   * @param {boolean} options.raw - If true, return the raw body without parsing it
   * @returns 
   */
  getBody(options = {}) {
    let headers = this.req.headers;
    const contentType = headers?.['Content-Type'] || headers?.['content-type'] || '';
    const hasJSONContentType = contentType.includes('json');

    if (hasJSONContentType && !options.raw) {
      return JSON.parse(this.req.data);
    }

    return this.req.data;
  }

  setBody(data) {
    if (typeof data === 'object') {
      this.req.data = JSON.stringify(data);
      return;
    }

    this.req.data = data;
  }

  setMaxRedirects(maxRedirects) {
    this.req.maxRedirects = maxRedirects;
  }

  getTimeout() {
    return this.req.timeout;
  }

  setTimeout(timeout) {
    this.req.timeout = timeout;
  }
}

module.exports = BrunoRequest;
