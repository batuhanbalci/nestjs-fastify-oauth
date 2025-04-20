export interface IOAuthParams {
  readonly redirect_uri: string;
  readonly scope: string | string[];
  readonly state: string;
}
