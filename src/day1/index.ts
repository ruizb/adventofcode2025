import { Effect, Console } from "effect"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { program as part1 } from "./part1.ts"

NodeRuntime.runMain(
  part1.pipe(Effect.provide(NodeContext.layer), Effect.andThen(Console.log))
)
