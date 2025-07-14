import { Effect, Layer, Option, Schema } from "effect";
import { GameResult, GameSettings, DEFAULT_GAME_SETTINGS } from "@/types";

const STORAGE_KEYS = {
  GAME_RESULTS: "civics100_game_results",
  GAME_SETTINGS: "civics100_game_settings",
  VERSION: "civics100_storage_version",
} as const;

const STORAGE_VERSION = "1.0.0";

const safeJsonParse = (json: string | null): Option.Option<unknown> =>
  Schema.decodeUnknownOption(Schema.parseJson())(json);

const safeJsonStringify = <T>(
  value: T
): Effect.Effect<string, never, never> => {
  return Effect.try(() => JSON.stringify(value)).pipe(
    Effect.catchAll(() => Effect.succeed(""))
  );
};

const checkStorageAvailable = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

const migrateStorageIfNeeded = (): Effect.Effect<void, never, never> => {
  return Effect.sync(() => {
    if (!checkStorageAvailable()) return;

    const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION);

    if (currentVersion !== STORAGE_VERSION) {
      localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
    }
  });
};

const saveGameResult = (
  result: GameResult
): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return;

    yield* migrateStorageIfNeeded();

    const existingResults = yield* getGameResults();
    const updatedResults = [...existingResults, result];

    const maxResults = 50;
    const resultsToKeep = updatedResults.slice(-maxResults);

    const jsonString = yield* safeJsonStringify(resultsToKeep);
    if (jsonString) {
      localStorage.setItem(STORAGE_KEYS.GAME_RESULTS, jsonString);
    }
  });
};

const getGameResults = (): Effect.Effect<
  readonly GameResult[],
  never,
  never
> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return [];

    yield* migrateStorageIfNeeded();

    const json = localStorage.getItem(STORAGE_KEYS.GAME_RESULTS);
    const parsed = safeJsonParse(json);

    const results = Option.getOrElse(parsed, () => []);

    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((r: unknown) => {
      const result = r as Record<string, unknown>;
      return {
        sessionId: (result.sessionId as string) || "",
        totalQuestions: (result.totalQuestions as number) || 0,
        correctAnswers: (result.correctAnswers as number) || 0,
        percentage: (result.percentage as number) || 0,
        isEarlyWin: (result.isEarlyWin as boolean) || false,
        completedAt:
          result.completedAt !== undefined
            ? new Date(result.completedAt as string)
            : new Date(),
      };
    });
  });
};

const saveGameSettings = (
  settings: GameSettings
): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return;

    yield* migrateStorageIfNeeded();

    const jsonString = yield* safeJsonStringify(settings);
    if (jsonString) {
      localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, jsonString);
    }
  });
};

const getGameSettings = (): Effect.Effect<GameSettings, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return DEFAULT_GAME_SETTINGS;

    yield* migrateStorageIfNeeded();

    const json = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
    const parsed = safeJsonParse(json);

    const settings = Option.getOrElse(parsed, () => DEFAULT_GAME_SETTINGS);
    const settingsRecord = settings as Record<string, unknown>;

    return {
      maxQuestions:
        (settingsRecord.maxQuestions as number) ??
        DEFAULT_GAME_SETTINGS.maxQuestions,
      winThreshold:
        (settingsRecord.winThreshold as number) ??
        DEFAULT_GAME_SETTINGS.winThreshold,
      userState:
        (settingsRecord.userState as string) ?? DEFAULT_GAME_SETTINGS.userState,
      darkMode:
        (settingsRecord.darkMode as boolean) ?? DEFAULT_GAME_SETTINGS.darkMode,
    };
  });
};

const clearAllData = (): Effect.Effect<void, never, never> => {
  return Effect.sync(() => {
    if (!checkStorageAvailable()) return;

    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  });
};

const getRecentResults = (
  count: number
): Effect.Effect<readonly GameResult[], never, never> => {
  return Effect.gen(function* () {
    const allResults = yield* getGameResults();
    return [...allResults].slice(-count).reverse();
  });
};

const getGameStats = (): Effect.Effect<
  {
    totalGames: number;
    averageScore: number;
    bestScore: number;
    earlyWins: number;
  },
  never,
  never
> => {
  return Effect.gen(function* () {
    const results = yield* getGameResults();

    if (results.length === 0) {
      return {
        totalGames: 0,
        averageScore: 0,
        bestScore: 0,
        earlyWins: 0,
      };
    }

    const totalGames = results.length;
    const averageScore = Math.round(
      results.reduce((sum, r) => sum + r.percentage, 0) / totalGames
    );
    const bestScore = Math.max(...results.map((r) => r.percentage));
    const earlyWins = results.filter((r) => r.isEarlyWin).length;

    return {
      totalGames,
      averageScore,
      bestScore,
      earlyWins,
    };
  });
};

export class LocalStorageService extends Effect.Service<LocalStorageService>()(
  "LocalStorageService",
  {
    effect: Effect.succeed({
      saveGameResult,
      getGameResults,
      saveGameSettings,
      getGameSettings,
      clearAllData,
      getRecentResults,
      getGameStats,
      checkStorageAvailable: () => checkStorageAvailable(),
    }),
  }
) {}

export const TestLocalStorageServiceLayer = (fn?: {
  saveGameResult?: (result: GameResult) => Effect.Effect<void, never, never>;
  getGameResults?: () => Effect.Effect<readonly GameResult[], never, never>;
  saveGameSettings?: (
    settings: GameSettings
  ) => Effect.Effect<void, never, never>;
  getGameSettings?: () => Effect.Effect<GameSettings, never, never>;
  clearAllData?: () => Effect.Effect<void, never, never>;
  getRecentResults?: (
    count: number
  ) => Effect.Effect<readonly GameResult[], never, never>;
  getGameStats?: () => Effect.Effect<
    {
      totalGames: number;
      averageScore: number;
      bestScore: number;
      earlyWins: number;
    },
    never,
    never
  >;
  checkStorageAvailable?: () => boolean;
}) =>
  Layer.succeed(
    LocalStorageService,
    LocalStorageService.of({
      _tag: "LocalStorageService",
      saveGameResult: fn?.saveGameResult ?? (() => Effect.succeed(void 0)),
      getGameResults: fn?.getGameResults ?? (() => Effect.succeed([])),
      saveGameSettings: fn?.saveGameSettings ?? (() => Effect.succeed(void 0)),
      getGameSettings:
        fn?.getGameSettings ?? (() => Effect.succeed(DEFAULT_GAME_SETTINGS)),
      clearAllData: fn?.clearAllData ?? (() => Effect.succeed(void 0)),
      getRecentResults: fn?.getRecentResults ?? (() => Effect.succeed([])),
      getGameStats:
        fn?.getGameStats ??
        (() =>
          Effect.succeed({
            totalGames: 0,
            averageScore: 0,
            bestScore: 0,
            earlyWins: 0,
          })),
      checkStorageAvailable: fn?.checkStorageAvailable ?? (() => false),
    })
  );
