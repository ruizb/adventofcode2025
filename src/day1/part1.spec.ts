import { FileSystem, Path } from "@effect/platform"
import { Effect, Exit, Layer } from "effect"
import { describe, expect, it } from "vitest"
import { program } from "./part1.ts"

describe("Day 1 part 1", () => {
  it("should succeed with the nominal case", async () => {
    const layers = Layer.merge(
      FileSystem.layerNoop({
        readFileString: () =>
          Effect.succeed("L68\nL30\nR48\nL5\nR60\nL55\nL1\nL99\nR14\nL82\n"),
      }),
      Path.layer
    )

    const runnable = Effect.provide(program, layers)

    await expect(Effect.runPromiseExit(runnable)).resolves.toEqual(
      Exit.succeed(3)
    )
  })

  it("should fail if line has wrong format (direction)", async () => {
    const layers = Layer.merge(
      FileSystem.layerNoop({
        readFileString: () => Effect.succeed("L68\nL30\nS48\n"),
      }),
      Path.layer
    )

    const runnable = Effect.provide(program, layers)

    await expect(Effect.runPromiseExit(runnable)).resolves.toEqual(
      Exit.fail(
        expect.objectContaining({
          message:
            "Invalid dial step provided: S48. Expected L<number> or R<number>, examples: L60, R48.",
        })
      )
    )
  })

  it("should fail if line has wrong format (distance)", async () => {
    const layers = Layer.merge(
      FileSystem.layerNoop({
        readFileString: () =>
          Effect.succeed("L68\nL30\nR48\nL5.12\nR60\nL55\nL1\n"),
      }),
      Path.layer
    )

    const runnable = Effect.provide(program, layers)

    await expect(Effect.runPromiseExit(runnable)).resolves.toEqual(
      Exit.fail(
        expect.objectContaining({
          message:
            "Invalid dial step provided: L5.12. Expected L<number> or R<number>, examples: L60, R48.",
        })
      )
    )
  })
})
