export interface BasicRawCompletion {
  name?: string;
  desc?: string;
  browsers?: string;
  body?: string;
  status?: string;
  mdn_url?: string;
  restriction?: string;
  values?: { name?: string; desc?: string; browsers?: string }[];
}
