import {
  Array,
  Effect,
  Option,
  Schema,
  ParseResult,
  identity,
  Data,
} from "effect"
import { DayNumber, DayPart, inputLines } from "../utils.ts"

const day = DayNumber(1)
const part = DayPart(1)

const STEPS_COUNT = 100

const DIRECTION_TO_COEF = {
  L: -1,
  R: 1,
} satisfies Record<Direction, number>

export class InputIsEmptyError extends Data.TaggedError(
  "InputIsEmptyError"
)<{}> {}

const DirectionSchema = Schema.Literal("L", "R")
type Direction = typeof DirectionSchema.Type

const DistanceSchema = Schema.Int.pipe(Schema.positive()).pipe(
  Schema.brand("Distance")
)

export const DialStep = Schema.transform(
  Schema.String,
  Schema.Struct({ direction: Schema.String, distance: Schema.String }),
  {
    strict: true,
    decode: line => ({
      direction: line.substring(0, 1),
      distance: line.substring(1),
    }),
    encode: ({ direction, distance }) => `${direction}${distance}`,
  }
)
  .pipe(
    Schema.transformOrFail(
      Schema.Struct({
        direction: DirectionSchema,
        distance: DistanceSchema,
      }),
      {
        strict: true,
        decode: ({ direction, distance }, options, ast) => {
          return Effect.Do.pipe(
            Effect.bind("direction", () =>
              Schema.decodeUnknown(DirectionSchema)(direction)
            ),
            Effect.bind("distance", () =>
              Schema.decodeUnknown(
                Schema.compose(Schema.NumberFromString, DistanceSchema)
              )(distance)
            ),
            Effect.mapBoth({
              onSuccess: identity,
              onFailure: error =>
                new ParseResult.Type(
                  ast,
                  { direction, distance },
                  error.message
                ),
            })
          )
        },
        encode: ({ direction, distance }, options, ast) =>
          ParseResult.succeed({
            direction,
            distance: distance.toString(),
          }),
      }
    )
  )
  .annotations({
    message: ({ actual }) =>
      `Invalid dial step provided: ${actual}. Expected L<number> or R<number>, examples: L60, R48.`,
  })

type DialStep = typeof DialStep.Type

type LoopState = {
  dial: number
  password: number
}

const loopIteration = ({
  state,
  input,
}: {
  state: LoopState
  input: readonly string[]
}) =>
  Effect.Do.pipe(
    Effect.bind("line", () =>
      Array.head(input).pipe(
        Option.match({
          onSome: Effect.succeed,
          onNone: () => Effect.fail(new InputIsEmptyError()),
        })
      )
    ),
    Effect.let("newInput", () =>
      Array.tail(input).pipe(Option.getOrElse(() => [] as string[]))
    ),
    Effect.bind("step", ({ line }) => Schema.decodeUnknown(DialStep)(line)),
    Effect.let("newDial", ({ step }) => {
      const { direction, distance } = step
      return (
        (state.dial + DIRECTION_TO_COEF[direction] * distance) % STEPS_COUNT
      )
    }),
    Effect.andThen(({ newInput, newDial }) => {
      return {
        state: {
          password: newDial === 0 ? state.password + 1 : state.password,
          dial: newDial < 0 ? STEPS_COUNT + newDial : newDial,
        },
        input: newInput,
      }
    })
  )

export const program = Effect.Do.pipe(
  Effect.bind("input", () => inputLines(day, Option.none())),
  Effect.let("initialState", () => ({ password: 0, dial: 50 })),
  Effect.andThen(({ input, initialState }) =>
    Effect.iterate(
      { state: initialState, input },
      {
        while: ({ input }) => input.length > 0,
        body: loopIteration,
      }
    )
  ),
  Effect.map(({ state: { password } }) => password)
)
