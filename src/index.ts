import { resolve } from "path";
import * as TJS from "typescript-json-schema";
import { inspect } from "util";

const program = TJS.programFromConfig(resolve("", "tsconfig.json"));

const schema = TJS.generateSchema(program, "UserDocument", { ref: false });
console.log(inspect(schema, false, null, true));
console.log("----------------------------------------");
console.log(inspect(getFields(schema), false, null, true));

type Field = {
  name: string;
  type: string;
  mode: string;
  fields?: Field[];
};

function getField(name: string, def: TJS.DefinitionOrBoolean): Field {
  if (typeof def === "boolean")
    throw new Error("NOT IMPLEMENTED: Definition is boolean");

  const field: Field = {
    name,
    type: getFieldType(def),
    mode: getFieldMode(def),
  };
  const fields = getFields(def);
  if (fields) field.fields = fields;
  return field;
}

function getFieldType(def: TJS.Definition): string {
  if (def.anyOf) return "RECORD";
  if (def.type === "object" && def.properties) return "RECORD";
  if (
    def.type === "array" &&
    typeof def.items === "object" &&
    "type" in def.items
  ) {
    return getFieldType(def.items);
  }
  if (typeof def.type === "string") return def.type.toUpperCase();
  return "### TYPE UNKNOWN ###";
}

function getFieldMode(def: TJS.Definition): string {
  if (def.type === "array") return "REPEATABLE";
  return "NULLABLE";
}

function getFields(def: TJS.Definition): Field[] | undefined {
  if (def.anyOf) {
    return def.anyOf.flatMap();
  } else if (def.type === "object" && def.properties) {
    return Object.keys(def.properties).map((pName) => {
      return getField(pName, def.properties[pName]);
    });
  } else if (
    def.type === "array" &&
    typeof def.items === "object" &&
    (def.items as any).type === "object"
  ) {
    return getFields(def.items as TJS.Definition);
  }
  return undefined;
}
