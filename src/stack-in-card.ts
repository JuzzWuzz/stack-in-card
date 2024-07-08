import { CARD_NAME } from "./card/const";
import * as pjson from "../package.json";
import "./card/stack-in-card";

/* eslint no-console: 0 */
console.info(
  `%c  ${CARD_NAME.toUpperCase}  \n%c Version ${pjson.version} `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray",
);
