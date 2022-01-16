import MagicString from "magic-string";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import MonacoEditor, {
  EditorProps,
  useMonaco,
  Monaco,
} from "@monaco-editor/react";
// @ts-ignore
import bundled from "!raw-loader!../magic-string-playground.d.ts";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function evaluate(code: string, input: string): Promise<string> {
  try {
    const fn = new AsyncFunction("ms", "original", code);
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
    throw e;
  }
}

const INITIAL_CODE = `// Type your code here`;
const INITIAL_TRANSFORMATION = `
/**
  * Type your transformation here
  * You can use the following values:
  *
  * @param ms - The MagicString instance
  * @param original - The original input
  */

ms.append(". This is amazing!");
`.trim();

export default function Home() {
  let [code, setCode] = useState(INITIAL_CODE);
  let [transformation, setTransformation] = useState(INITIAL_TRANSFORMATION);
  let [output, setOutput] = useState("");
  let [isErrored, setIsErrored] = useState<string>();
  const monaco = useMonaco();
  const ref = useRef(false);

  if (monaco && !ref.current) {
    ref.current = true;
    setupSources(monaco);
  }

  useEffect(() => {
    if (monaco) {
      return setupSources(monaco);
    }
  }, [monaco]);

  useEffect(() => {
    evaluate(transformation, code).then(
      (v) => {
        setOutput(v);
        setIsErrored(undefined);
      },
      (err) => {
        console.error(err);
        setIsErrored(String(err.message));
      }
    );
  }, [transformation, code]);

  return (
    <div className="parent">
      <Head>
        <title>Magic String playground</title>
      </Head>
      <Editor
        options={{
          suggest: { preview: false },
          suggestOnTriggerCharacters: false,
          hover: { enabled: false },
          quickSuggestions: false,
        }}
        containerClassName="div1"
        value={code}
        onChange={(c) => c && setCode(c)}
      />
      <Editor
        errorMessage={isErrored}
        containerClassName="div2"
        value={transformation}
        onChange={(v) => v && setTransformation(v)}
      />
      <Editor
        containerClassName="div3"
        value={output}
        options={{
          readOnly: true,
          hover: { enabled: false },
        }}
      />
      <style global jsx>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
            "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
            "Helvetica Neue", sans-serif;
        }

        .parent {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          grid-gap: 0.2em;

          min-height: 100vh;
          min-width: 100vw;
        }

        .errored {
          border: 2px solid red;
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

function Editor(
  props: EditorProps & { containerClassName?: string; errorMessage?: string }
) {
  return (
    <div className={props.containerClassName} style={{ position: "relative" }}>
      {props.errorMessage && (
        <div className="error-message">{props.errorMessage}</div>
      )}
      <MonacoEditor
        height="100%"
        width="100%"
        language="javascript"
        {...props}
        options={{
          minimap: {
            enabled: false,
          },
          ...props.options,
        }}
      />
      <style jsx>{`
        .error-message {
          color: red;
          background-color: #ffcdd2;
          padding: 0.5em;
          border-radius: 0.5em;
          position: absolute;
          left: 0.5em;
          bottom: 0.5em;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}

function setupSources(monaco: Monaco) {
  const v = monaco.languages.typescript.javascriptDefaults.addExtraLib(`
    ${bundled}

    declare global {
      declare const ms: MagicString;
      declare const original: string;
    }
  `);

  return () => v.dispose();
}
