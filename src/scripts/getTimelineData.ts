import type { SpectateMatch } from "../domain/types";

export function getTimelineData(timelines: SpectateMatch["timelines"]) {
  const types = [...new Set(timelines.map((timeline) => timeline.type))].sort();

  console.log("Timeline types:", types);

  return types;
}

const inputFile = process.env.INPUT_FILE ?? "./input.txt";
const content = await Bun.file(inputFile).text();
const spectateObject = JSON.parse(content) as SpectateMatch;
getTimelineData(spectateObject.timelines);
