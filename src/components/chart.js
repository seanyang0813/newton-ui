import { useState, useRef } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";
import { parseJsonToDict } from "../app/parser";

const defaultMap = {
  "bw_kbps": 100000,
  "delay_ms": 100,
  "loss_pct": 0,
  "jitter_ms": 0
}

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

const Chart = ({ data, modifyKeyWithData, dataKey, maxTime }) => {
  const [label, setLabel] = useState(null);
  const [payloadData, setPayloadData] = useState(null);
  const [lastClickedX, setLastClickedX] = useState(null);
  const [code, setCode] = useState("{}");
  const bwRef = useRef();
  const timeRef = useRef();
  console.log(data);
  function extractPayload(payload) {
    if (payload) {
      console.log(JSON.stringify(payload));
      console.log(payload.activeLabel);
      console.log(payload.activePayload);
      setLabel(payload.activeLabel);
      setPayloadData(payload.activePayload[0].dataKey);
    }
  }

  function mapData(data) {
    const res = [];
    let prev = null;
    if (!data) {
      return res;
    }
    for (let i = 0; i < data.length; i++) {
      if (i == 0) {
        res.push(data[i]);
      } else {
        if (prev != null && prev != data[i]) {
          // cache data to draw better lines for the drop to show instaneous drop
          res.push({ x: data[i].x, y: prev.y });
          res.push(data[i]);
        }
      }
      prev = data[i];
    }
    if (res.length > 0) {
      res.push({x: maxTime, y: data[data.length - 1].y })
    }

    return res;
  }

  const onClickPoint = (d) => {
    console.log(d.payload);
    // try to update x of the payload
    if (d.payload.x != null) {
      setLastClickedX(d.payload.x);
      timeRef.current.value = d.payload.x;
      bwRef.current.value = d.payload.y;
      // find the y in data
    }
  };

  const updateValue = (x_value, new_y_value) => {
    let new_data = data.map((b) => {
      if (b.x === x_value) {
        return { x: x_value, y: new_y_value };
      } else {
        return b;
      }
    });
    modifyKeyWithData(dataKey, new_data);
    console.log("updated value");
  };

  const insideData = (x) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].x === x) {
        return true;
      }
    }
    return false;
  };

  const deleteCurrentX = () => {
    let x_to_delete = lastClickedX;
    if (x_to_delete === null) {
      return;
    }
    let new_data = [];
    console.log("deleting x " + x_to_delete);
    for (let i = 0; i < data.length; i++) {
      console.log(data[i].x);
      if (data[i].x !== x_to_delete) {
        new_data.push(data[i]);
      }
    }
    modifyKeyWithData(dataKey, new_data);
  };

  const addPoint = (time, bw) => {
    if (insideData(time)) {
      updateValue(time, bw);
      return;
    }
    // make sure it's not already inside the chart
    let new_data = data.map((b) => b);
    new_data.push({ x: time, y: bw });
    // sort by time in ascending order
    new_data = new_data.sort((a, b) => a.x - b.x);
    modifyKeyWithData(dataKey, new_data);
    console.log("added point");
  };

  const updateData = () => {
    // get ref for time and bandwidth
    setLastClickedX(null);
    let time = parseInt(timeRef.current.value);
    let bw = parseInt(bwRef.current.value);
    if (time != null && bw != null) {
      addPoint(time, bw);
    }
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
          line
        >
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="time" unit="ms" />
          <YAxis type="number" dataKey="y" name={dataKey} />
          <ZAxis type="number" range={[100]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter
            name={dataKey}
            data={mapData(data)}
            fill="#8884d8"
            line
            shape="circle"
            onClick={onClickPoint}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="flex justify-center items-center">
        <div className="mr-3">
          <label
            htmlFor="time"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Time (ms)
          </label>
          <input
            ref={timeRef}
            min="0"
            type="number"
            id="time"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="0"
            required
          ></input>
        </div>
        <div className="mr-3">
          <label
            htmlFor="bw"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            {dataKey}
          </label>
          <input
            ref={bwRef}
            min="0"
            type="number"
            id="bw"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="0"
            required
          ></input>
        </div>
        <button
          onClick={updateData}
          className="mt-3 mr-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
        >
          Update
        </button>
        {lastClickedX && (
          <button
            onClick={() => {
              deleteCurrentX();
            }}
            className="mt-3 bg-transparent hover:bg-red-500 text-red-700 font-semibold hover:text-white py-2 px-4 border border-red-500 hover:border-transparent rounded"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default Chart;
