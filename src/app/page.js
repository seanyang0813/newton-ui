"use client";
import Image from "next/image";
import Chart from "../components/chart";
import { useState } from "react";
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";
import { parseJsonToDict, reconstructJson, getMaxTime } from "../app/parser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

const example = `{
  "profile": [
    {
      "audio": {
        "send": true
      },
      "network": {
        "bw_kbps": 1000,
        "delay_ms": 200,
        "jitter_ms": 0
      },
      "time_ms": 0,
      "video": {
        "randomized": true,
        "send": true,
        "utilization_pct": 100
      }
    },
    {
      "network": {
        "bw_kbps": 50
      },
      "time_ms": 45000
    },
    {
      "network": {
        "bw_kbps": 1000
      },
      "time_ms": 90000
    },
    {
      "network": {
        "bw_kbps": 50
      },
      "time_ms": 135000
    },
    {
      "network": {
        "bw_kbps": 1000
      },
      "time_ms": 180000
    },
    {
      "network": {
        "bw_kbps": 50
      },
      "time_ms": 225000
    }
  ],
  "seed": 12345
}`;

export default function Home() {
  const [code, setCode] = useState(example);
  const [data, setData] = useState(parseJsonToDict(example));
  const [lastValidCode, setLastValidCode] = useState(example)

  function getMaxTime() {
    let res = 0
    // check last index of each data
    Object.entries(data).map(([key, values]) => {
      console.log(values)
      if (values.length > 0 && values[values.length - 1].x !== undefined) {
        res = Math.max(res, values[values.length - 1].x)
      }
    })
    console.log("max time is " + res + "ms ")
    return res
  }

  function modifyKeyWithData(key, new_value) {
    // find the key's reference in data
    if (data.hasOwnProperty(key)) {
      // do a spread and do setState to update the data
      setData((old) => {
        const new_state = { ...old };
        new_state[key] = new_value;
        return new_state;
      });
    }
  }

  function regenJson() {
    let generated = reconstructJson(data, lastValidCode)
    if (generated) {
      setLastValidCode(generated)
      setCode(generated)
      toast.success('Generated!', {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(code)
    toast.success('Copied!', {
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      });
  }

  function updateCharts() {
    // setData(parseJsonToDict(evn.target.value).bw_kbps);
    // only set data if parse json doesn't return error
    let res = parseJsonToDict(code);
    if (res !== null) {
      setData(res);
      setLastValidCode(code)
    } else {
      toast.warn('Invalid Json format', {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-between max-h-screen">

<ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      <div className="z-10 w-full font-mono text-sm max-h-full">
        <div className="grid grid-cols-5 p-5 h-screen">
          <div className="col-span-3 max-h-screen overflow-scroll">
            {Object.entries(data).map(([key, values]) => {
              console.log("inside map");
              console.log(key);
              console.log(values);
              return (
                <Chart
                  key={key}
                  data={values}
                  modifyKeyWithData={modifyKeyWithData}
                  dataKey={key}
                  maxTime={getMaxTime()}
                />
              );
            })}
          </div>
          <div className="max-h-screen overflow-scroll col-span-2 m-3 relative rounded-lg">
            <div className="sticky top-0 z-30 bg-slate-200 border-gray-200 dark:bg-gray-900 flex justify-center">
              <button
                onClick={updateCharts}
                className="mt-3 mb-2 mr-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
              >
                Update charts
              </button>
              <button
                onClick={regenJson}
                className="mt-3 mb-2 mr-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
              >
                Regenerate JSON
              </button>
              <button
                onClick={copyToClipboard}
                className="mt-3 mb-2 mr-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
              >
                Copy to Clipboard
              </button>
            </div>
            <CodeEditor
              value={code}
              language="json"
              placeholder="Paste Json code here..."
              onChange={(evn) => {
                setCode(evn.target.value);
              }}
              padding={15}
              style={{
                fontSize: 12,
                backgroundColor: "#f5f5f5",
                fontFamily:
                  "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
              }}
            />
          </div>
        </div>

      </div>
    </main>

  );
}
