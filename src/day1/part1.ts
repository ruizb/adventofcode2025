import { Effect, Console, Option } from "effect"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { DayNumber, DayPart, inputLines } from "../utils.ts"

const day = DayNumber(1)
const part = DayPart(1)

const program = Effect.Do.pipe(
  Effect.bind("input", () => inputLines(day, Option.some(part))),
  Effect.andThen(({ input }) => Console.log(input))
)

NodeRuntime.runMain(
  program.pipe(Effect.provide(NodeContext.layer), Effect.andThen(Console.log))
)
