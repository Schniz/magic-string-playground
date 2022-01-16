import dynamic from "next/dynamic";
import MagicString from "magic-string";
import { useEffect, useState } from "react";

const MonacoEditor = dynamic(() => import("react-monaco-editor"), {
  ssr: false,
});

async function evaluate(code: string, input: string): Promise<string> {
  try {
    const fn = eval(`(async function(ms, original) { ${code} })`);
    const ms = new MagicString(input);
    await fn(ms, input);
    const map = ms.generateMap({
      includeContent: true,
      source: "user-code.js",
    });
    const newOutput = [
      ms.toString(),
      `//# sourceMappingURL=${map.toUrl()}`,
    ].join("\n");
    return newOutput;
  } catch (e) {
    console.error(e);
    return "";
  }
}

export default function Home() {
  let [code, setCode] = useState("");
  let [transformation, setTransformation] = useState("");
  let [output, setOutput] = useState("");

  useEffect(() => {
    try {
      evaluate(transformation, code).then(setOutput, console.error);
    } catch (e) {
      console.error(e);
    }
  }, [transformation, code]);

  return (
    <div>
      <MonacoEditor
        width="800"
        height="600"
        language="javascript"
        theme="vs-dark"
        value={code}
        options={{
          minimap: {
            enabled: false,
          },
        }}
        onChange={setCode}
      />
      <MonacoEditor
        width="800"
        height="600"
        language="javascript"
        theme="vs-dark"
        value={transformation}
        options={{
          minimap: {
            enabled: false,
          },
        }}
        onChange={setTransformation}
      />
      <MonacoEditor
        width="800"
        height="600"
        language="javascript"
        theme="vs-dark"
        value={output}
        options={{
          readOnly: true,
          minimap: {
            enabled: false,
          },
        }}
      />
    </div>
  );
}
