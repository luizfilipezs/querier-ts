import { AllowedNames } from '.';

/**
 * Use this with a simple Pick to get the right interface, excluding the undesired type.
 */
export type OmitType<Base, Type> = Pick<Base, AllowedNames<Base, Type>>;
