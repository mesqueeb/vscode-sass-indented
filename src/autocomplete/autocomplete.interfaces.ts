export interface BasicRawCompletion {
  name: string;
  desc?: string;
  browsers?: string;
  body?: string;
  restriction?: string;
  values?: { name?: string; desc?: string; browsers?: string }[];
}
