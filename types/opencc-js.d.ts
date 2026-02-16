declare module "opencc-js" {
  export type LocaleCode = "cn" | "hk" | "jp" | "t" | "tw";

  export interface ConverterOptions {
    from: LocaleCode;
    to: LocaleCode;
  }

  export function Converter(
    options: ConverterOptions,
  ): (input: string) => string;
}
