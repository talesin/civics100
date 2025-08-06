import { Config, Data, Effect } from 'effect'
import { parseHTML as _parseHTML } from 'linkedom'

/** Alternative config values type */
export type AltValue =
  | { keys: string[]; value?: undefined; config?: undefined }
  | { value: string; keys?: undefined; config?: undefined }
  | { config: Config.Config<string>; keys?: undefined; value?: undefined }

/** Return typed config from array of keys with optional fallback values */
export const getConfig = <const T extends ReadonlyArray<string>>(
  names: T,
  alt?: { [K in T[number] as K]?: AltValue }
) =>
  Effect.gen(function* () {
    const getFirstConfig = (keys: string[]): Config.Config<string> => {
      if (keys.length === 0) return Config.fail(`not found`)
      const [key, ...rest] = keys
      return Config.string(key).pipe(Config.orElse(() => getFirstConfig(rest)))
    }

    const get = alt
      ? (name: string) => {
          const altValue = alt[name as keyof typeof alt]
          return getFirstConfig(altValue?.keys ?? [name]).pipe(
            Config.orElse(() =>
              altValue?.value !== undefined
                ? Config.succeed(altValue.value)
                : altValue?.config !== undefined
                  ? altValue.config
                  : Config.fail(`Config for '${name}' does not exist`)
            )
          )
        }
      : (name: string) => Config.string(name)

    // map array of Config into Config of array
    const xs = yield* Config.all(
      names.map((name) => get(name).pipe(Config.map((value) => [name, value] as const)))
    )

    // type return value
    return Object.fromEntries(xs) as {
      [K in T[number] as K]: string
    }
  })

/**
 * Extracts the success type from an Effect.
 * @template T - The Effect type to extract from.
 * @returns The success type of the Effect.
 */
export type EffectSuccessType<T> = T extends Effect.Effect<infer A, infer _, infer _> ? A : never

/**
 * Generator that returns sibling elements of the given element.
 * @param element The element to get siblings for.
 * @returns Generator of sibling elements.
 */
export function* getElementSiblings(element: Element | null): Generator<Element> {
  if (!element) return
  while (element.nextElementSibling) {
    yield element.nextElementSibling
    element = element.nextElementSibling
  }
}

export class ParseHTMLError extends Data.TaggedError('ParseHTMLError')<{
  message: string
  html: string
  cause: unknown
}> {}
export const parseHTML = (html: string) =>
  Effect.try({
    try: () => _parseHTML(html),
    catch: (cause) => new ParseHTMLError({ message: 'Failed to parse HTML', html, cause })
  })

/**
 * Parses the HTML and returns the DOM document.
 * @param html The HTML to parse.
 * @returns The DOM document.
 */
export const getDOMDocument = (html: string) =>
  parseHTML(html).pipe(Effect.map((doc) => doc.document))
