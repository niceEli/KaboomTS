import k from "../kaboom";
import { hexToRgb } from "../kUtils/kColor";
import matterRect, {
  matterRect4Sprites,
  matterRect4Static,
} from "./kMatterRect";
import PlayerPawnCircle from "./kMatterPlayerCircle";
import kCamera from "./kCamera";
import kReset from "./kReset";
import { GameObj, SceneDef } from "kaboom";
import Matter from "matter-js";
import matterCircle from "./kMatterCircle";
import kDownloadToVar from "./kDownloadToVar";
import loadSpritesSheet from "./kLoadSpriteSheet";

export default function kLdtkSceneImporter(
  sceneData,
  levelsize: number = 2,
  currentScene: SceneDef,
  nextScene: SceneDef,
  engine?: any
) {
  // Load The Level
  k.scene("scene", currentScene);
  k.loadSprite("CTPlayer", "CTPlayer.png");
  k.loadSprite("box", "box.png");
  k.loadSprite("door", "end.png");

  let isInlevel: number;
  let scripts = [];
  let groups = [];
  let CTriggers = [];

  let classTiles = [];

  let score: number = 0;
  let lives: number = 0;
  let health: number = 0;

  for (let i = 0; i < 9999; i++) {
    groups.push({ active: false, chgX: 0, chgY: 0 });
  }

  let maxGroups = -1;

  // this will spawn everything from ldtk
  for (let i = 0; i < sceneData.levels.length; i++) {
    const element = sceneData.levels[i];
    let bg = k.add([
      k.rect(element.pxWid * levelsize, element.pxHei * levelsize),
      k.pos(element.worldX * levelsize, element.worldY * levelsize),
      k.z(-2147483647),
      k.area(),
      "BG",
      k.color(
        hexToRgb(element.__bgColor).r,
        hexToRgb(element.__bgColor).g,
        hexToRgb(element.__bgColor).b
      ),
    ]);
    for (let i = 0; i < element.layerInstances.length; i++) {
      if (element.layerInstances[i].__type === "Entities") {
        for (
          let z = 0;
          z < element.layerInstances[i].entityInstances.length;
          z++
        ) {
          const ent = element.layerInstances[i].entityInstances[z];
          if (ent.__identifier == "Collider") {
            k.add([
              k.rect(levelsize * ent.width, levelsize * ent.height),
              k.pos(
                (ent.__worldX + ent.width / 2) * levelsize,
                (ent.__worldY + ent.height / 2) * levelsize
              ),
              k.anchor("center"),
              k.opacity(0),
              matterRect(engine, { isStatic: true }),
            ]);
          } else if (ent.__identifier == "Death_Trig") {
            k.add([
              k.rect(levelsize * ent.width, levelsize * ent.height),
              k.pos(
                (ent.__worldX + ent.width / 2) * levelsize,
                (ent.__worldY + ent.height / 2) * levelsize
              ),
              k.anchor("center"),
              k.opacity(0),
              k.area(),
              "Death_Trig",
            ]);
          } else if (ent.__identifier == "Player_Start") {
            var player: GameObj = k.add([
              k.pos(ent.__worldX * levelsize, ent.__worldY * levelsize),
              k.anchor("center"),
              k.rotate(0),
              k.sprite("SpriteSheet3"),
              k.scale(levelsize),
              k.z(2147483647),
              k.fadeIn(0.16),
              k.opacity(),
              // Matter For Pawns
              PlayerPawnCircle(
                engine,
                { friction: 0 },
                8 * levelsize,
                k.vec2(levelsize, levelsize)
              ),
              kCamera(ent.fieldInstances[0].__value),
              kReset(currentScene),
              k.area(),
              "Player",
            ]);
          } else if (ent.__identifier == "Box_Spawner") {
            k.add([
              k.pos(ent.__worldX * levelsize, ent.__worldY * levelsize),
              k.anchor("center"),
              k.sprite("SpriteSheet30"),
              k.scale(levelsize),
              k.z(2147483646),
              k.fadeIn(0.16),
              k.opacity(),
              matterRect4Sprites(
                engine,
                { angle: 0 },
                k.vec2(16 * levelsize, 16 * levelsize)
              ),
            ]);
          } else if (ent.__identifier == "Win_Condition") {
            k.add([
              k.pos(ent.__worldX * levelsize, ent.__worldY * levelsize),
              k.anchor("center"),
              k.sprite("door"),
              k.scale(2 * levelsize),
              k.z(-2147483645),
              k.area(),
              "Win_Condition",
            ]);
          } else if (ent.__identifier == "Text_Object") {
            k.add([
              k.text(ent.fieldInstances[0].__value, {
                size: ent.fieldInstances[1].__value,
                font: "sans-serif",
                align: "center",
              }),
              k.anchor("center"),
              k.z(2147483645),
              k.color(ent.fieldInstances[2].__value),
              k.pos(ent.__worldX * levelsize, ent.__worldY * levelsize),
            ]);
          } else if (ent.__identifier == "Script") {
            if (
              maxGroups < ent.fieldInstances[1].__value ||
              maxGroups < ent.fieldInstances[2].__value
            ) {
              let grp = ent.fieldInstances[1].__value;
              if (grp < ent.fieldInstances[2].__value) {
                grp = ent.fieldInstances[2].__value;
              }
              maxGroups = grp;
            }
            scripts.push({
              Func: ent.fieldInstances[0].__value,
              GroupID: ent.fieldInstances[1].__value,
              NextGID: ent.fieldInstances[2].__value,
              X: ent.__worldX * levelsize,
              Y: ent.__worldY * levelsize,
            });
          } else if (ent.__identifier == "StartTrigger") {
            if (maxGroups < ent.fieldInstances[0].__value) {
              maxGroups = ent.fieldInstances[0].__value;
            }
            groups.splice(ent.fieldInstances[0].__value, 1, {
              active: true,
              chgX: 0,
              chgY: 0,
            });
          } else if (ent.__identifier == "CollisionTrigger") {
            if (maxGroups < ent.fieldInstances[0].__value) {
              maxGroups = ent.fieldInstances[0].__value;
            }
            CTriggers.push({
              obj: k.add([
                k.rect(levelsize * ent.width, levelsize * ent.height),
                k.pos(
                  (ent.__worldX + ent.width / 2) * levelsize,
                  (ent.__worldY + ent.height / 2) * levelsize
                ),
                k.anchor("center"),
                k.opacity(0),
                k.area(),
                "CTrigger",
              ]),
              GroupID: ent.fieldInstances[0].__value,
              OneTime: ent.fieldInstances[1].__value,
            });
          } else if (ent.__identifier == "EditableTile") {
            let size = 16 * levelsize;
            let spritename =
              ent.fieldInstances[1].__value.x / 16 +
              (ent.fieldInstances[1].__value.y / 16) * 25;
            if (ent.fieldInstances[2].__value) {
              classTiles.push({
                entity: k.add([
                  k.scale(levelsize),
                  k.anchor("center"),
                  k.sprite("SpriteSheet" + spritename),
                  k.z(2000),
                  k.offscreen({ hide: true }),
                  k.pos(
                    ent.__worldX * levelsize + 8 * levelsize,
                    ent.__worldY * levelsize + 8 * levelsize
                  ),
                  matterRect4Static(engine, k.vec2(size, size)),
                  "Tile",
                ]),
                name: ent.fieldInstances[0].__value,
              });
            } else {
              classTiles.push({
                entity: k.add([
                  k.scale(levelsize),
                  k.sprite("SpriteSheet" + spritename),
                  k.anchor("center"),
                  k.z(2000),
                  k.offscreen({ hide: true }),
                  k.pos(
                    ent.__worldX * levelsize + 8 * levelsize,
                    ent.__worldY * levelsize + 8 * levelsize
                  ),
                  "Tile",
                ]),
                name: ent.fieldInstances[0].__value,
              });
            }
          }
        }
      } else if (element.layerInstances[i].__type === "Tiles") {
        for (let z = 0; z < element.layerInstances[i].gridTiles.length; z++) {
          let gridInstanceOnPoint = element.layerInstances[i].gridTiles[z];
          let spritename: number = gridInstanceOnPoint.t;

          k.add([
            k.scale(levelsize),
            k.sprite("SpriteSheet" + spritename),
            k.offscreen({ hide: true }),
            k.pos(
              gridInstanceOnPoint.px[0] * levelsize +
                element.worldX * levelsize,
              gridInstanceOnPoint.px[1] * levelsize + element.worldY * levelsize
            ),
            "Tile",
          ]);
        }
      }
    }
  }
  let checkGroups = async function () {
    try {
      let checkFlag = true;

      if (maxGroups !== -1) {
        if (checkFlag) {
          checkFlag = false;

          const asyncTasks = [];

          for (let i = 0; i <= maxGroups; i++) {
            let { GroupID, NextGID, Func, X, Y } = scripts[i];
            let group = groups[GroupID];

            if (group.active) {
              const runnableFunc = new Function(
                "k",
                "engine",
                "Matter",
                "groups",
                "scripts",
                "X",
                "Y",
                "currentScene",
                "nextScene",
                "classTiles",
                "matterRect",
                "matterRect4Sprites",
                "matterRect4Static",
                "PlayerPawnCircle",
                "matterCircle",
                "hexToRgb",
                "kDownloadToVar",
                "kCamera",
                "kReset",
                "loadSpritesSheet",
                "player",
                "score",
                "lives",
                "health",
                `
                return (async function() {
                  ${Func}
                })();
              `
              );

              asyncTasks.push(
                runnableFunc(
                  k,
                  engine,
                  Matter,
                  groups,
                  scripts,
                  X,
                  Y,
                  currentScene,
                  nextScene,
                  classTiles,
                  matterRect,
                  matterRect4Sprites,
                  matterRect4Static,
                  PlayerPawnCircle,
                  matterCircle,
                  hexToRgb,
                  kDownloadToVar,
                  kCamera,
                  kReset,
                  loadSpritesSheet,
                  player,
                  score,
                  lives,
                  health
                )
              );

              group = groups[GroupID];
              groups[GroupID] = { active: false, chgX: 0, chgY: 0 };
              groups[NextGID] = { active: true, chgX: 0, chgY: 0 };
            }
          }

          await Promise.all(asyncTasks);
        } else {
          checkFlag = true;
        }
      }
    } catch (error) {}
  };

  k.onUpdate(checkGroups);

  for (let i = 0; i < CTriggers.length; i++) {
    const element = CTriggers[i];
    element.obj.onCollide("Player", () => {
      groups.splice(element.GroupID, 1, { active: true, chgX: 0, chgY: 0 });
      if (element.OneTime) {
        k.destroy(element.obj);
      }
    });
  }

  player.onCollide("Death_Trig", () => {
    k.go("scene");
  });
  player.onCollide("Win_Condition", () => {
    k.scene("nextLevel", nextScene);
    k.go("nextLevel");
  });
  player.onCollideUpdate("BG", () => {
    isInlevel = 5;
  });
  k.onUpdate(() => {
    if (isInlevel <= 0) {
      k.go("scene");
    }
    isInlevel--;
  });
}
