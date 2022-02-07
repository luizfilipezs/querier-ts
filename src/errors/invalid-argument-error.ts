interface InvalidArgumentErrorConfig {
  method: string;
  param: string | number;
  argument: any;
  expected: string;
}

export class InvalidArgumentError extends Error {

  constructor({ method, param, argument, expected }: InvalidArgumentErrorConfig) {
    super(
      `${argument} is not a valid argument to param ${param} on ${method}(). ` +
      `It should be ${expected}.`
    );

    this.name = 'InvalidArgumentError';
  }

}
