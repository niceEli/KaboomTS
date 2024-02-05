import { SceneDef } from "kaboom";
import k from "../kaboom";
import * as IMC from "../Controls/INPUT_movement";

export default function kReset(currentScene: SceneDef, deathScore: number) {
  return {
    add() {
      k.scene("scene", currentScene);
    },
    update() {
      if (IMC.reseting()) {
        sessionStorage.setItem("score", String(deathScore));
        k.go("scene");
      }
    },
  };
}
