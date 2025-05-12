export type T_TokenStore = {
  saveToken(serviceId: string, account: string, token: any): Promise<boolean>;
  getToken(serviceId: string, account: string): Promise<any>;
  deleteToken(serviceId: string, account: string): Promise<boolean>;
}

export type T_OAuth2Config = T_ClientCredentialsGrantTypeConfig | T_PasswordGrantTypeConfig;

export type T_RequestConfig = {
  headers: {
    'Content-Type': string;
    'Authorization'?: string;
  };
}

export type T_ClientCredentialsGrantTypeConfig = {
  grantType: 'client_credentials';
  accessTokenUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  credentialsPlacement: string;
}

export type T_ClientCredentialsGrantTypeRequestData = {
  grant_type: string;
  scope: string;
  client_id?: string;
  client_secret?: string;
}

export type T_PasswordGrantTypeConfig = {
  grantType: 'password';
  accessTokenUrl: string;
  username: string;
  password: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  credentialsPlacement: string;
}

export type T_PasswordGrantTypeRequestData = {
  grant_type: string;
  scope: string;
  username: string;
  password: string;
  client_id?: string;
  client_secret?: string;
}
