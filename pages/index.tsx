import dynamic from "next/dynamic";
import MagicString from "magic-string";
import { useEffect, useState } from "react";
import { MonacoEditorProps } from "react-monaco-editor";
import Head from "next/head";

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

const INITIAL_CODE = `// Type your code here`;
const INITIAL_TRANSFORMATION = `// Type your transformation here
// You can use the following values:
// * ms - the MagicString instance
// * original - the original input

ms.append(". This is amazing!");
`;

export default function Home() {
  let [code, setCode] = useState(INITIAL_CODE);
  let [transformation, setTransformation] = useState(INITIAL_TRANSFORMATION);
  let [output, setOutput] = useState("");

  useEffect(() => {
    try {
      evaluate(transformation, code).then(setOutput, console.error);
    } catch (e) {
      console.error(e);
    }
  }, [transformation, code]);

  return (
    <div className="parent">
      <Head>
        <title>Magic String playground</title>
      </Head>
      <Editor containerClassName="div1" value={code} onChange={setCode} />
      <Editor
        containerClassName="div2"
        value={transformation}
        onChange={setTransformation}
      />
      <Editor
        containerClassName="div3"
        value={output}
        options={{ readOnly: true }}
      />
      <style global jsx>{`
        body {
          margin: 0;
          padding: 0;
        }

        .parent {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          grid-gap: 0.2em;

          min-height: 100vh;
          min-width: 100vw;
        }

        .div1 {
          grid-area: 1 / 1 / 2 / 2;
        }
        .div2 {
          grid-area: 2 / 1 / 3 / 2;
        }
        .div3 {
          grid-area: 1 / 2 / 3 / 3;
        }
      `}</style>
    </div>
  );
}

function Editor(props: MonacoEditorProps & { containerClassName?: string }) {
  return (
    <div className={props.containerClassName}>
      <MonacoEditor
        height="100%"
        width="100%"
        language="javascript"
        theme="vs-dark"
        {...props}
        options={{
          minimap: {
            enabled: false,
          },
          ...props.options,
        }}
      />
    </div>
  );
}
