// input is json and recrusively query to get all the network profile with timestamp
export function parseJsonToDict(jsonData) {
  // Parse JSON data
  const defaultMap = {
    bw_kbps: 1000,
    delay_ms: 100,
    loss_pct: 0,
    jitter_ms: 0,
  };

  const result = {};
  try {
    const data = JSON.parse(jsonData);
    console.log(data);
    // Extract values based on the dictionary key in the network profile
    let max_time = null;
    if (data.profile) {
      // instantiate all default plots
      result["bw_kbps"] = [{ x: 0, y: 1000 }];
      result["delay_ms"] = [{ x: 0, y: 100 }];
      result["loss_pct"] = [{ x: 0, y: 0 }];
      result["jitter_ms"] = [{ x: 0, y: 0 }];
      // add data points to them
      data.profile.forEach((profile) => {
        const network = profile.network;
        if (network) {
          // figure out which of the default profiles aren't seen if not seen add a point for default value
          Object.entries(network).forEach(([key, value]) => {
            if (profile.time_ms !== null) {
              max_time = profile.time_ms;
              if (result[key] && Number.isInteger(value)) {
                if (profile.time_ms == 0) {
                  console.log("reset default");
                  result[key] = [];
                }
                result[key].push({ x: profile.time_ms, y: value });
              } else {
                if (!result.hasOwnProperty(key) && Number.isInteger(value)) {
                  result[key] = [{ x: profile.time_ms, y: value }];
                }
              }
            }
          });
        }
      });
    }
    if (max_time !== null && max_time > 0) {
      // if the current object length is >= 1 and last one is not latest time we should add a data point for time with same value
      for (const [key, values] of Object.entries(result)) {
        console.log(`${key}:`, values);
        values.push({ x: max_time, y: values[values.length - 1].y });
      }
    }

    console.log("test");
    console.log(result);
  } catch (e) {
    console.log("invalid data" + e.message + console.log(jsonData));
    return null;
  }
  return result;
}

export function reconstructJson(data, original_json_string) {
  // start building json
  let res = {};
  res.profile = {};
  console.log("start reconstruct json")
  console.log(data)
  let time_pair = new Map();
  // build key value pair of time and data associated
  Object.entries(data).forEach(([key, value_arr]) => {
    // k is like kbps value is {x: time, y: value}
    value_arr.forEach((value) => {
      let time = value.x;
      let p_value = value.y;
      let data_key = key;
      if (!time_pair.has(time)) {
        time_pair.set(time, {});
      }
      time_pair.get(time)[data_key] = p_value;
    });
  });
  // get keys not included inside the data keys
  let network_keys = new Set(Object.keys(data));
  const original_json = JSON.parse(original_json_string);
  // remove keys from original json and then add them from the list we have from time pair
  if (original_json.profile) {
    // loop through profiles if it has network remove it
    for (let i = 0; i < original_json.profile.length; i++) {
      if (original_json.profile[i]["network"]) {
        // deleting key
        console.log("deleting key with value" + original_json.profile[i].network )
        delete original_json.profile[i].network;
      }
    }
  } else {
    original_json.profile = {};
  }
  console.log(time_pair)
  // insert the ones we have for new ones inside
  time_pair.forEach((values, key) => {
    // handle edge case of no time_ms just in case
    console.log("inserting with key and values" + key + values)
    original_json.profile = insert_network_profile(original_json.profile, key, values);
  });
  console.log("after insert")
  console.log(original_json.profile)

  // check for empty profile completely due to removing network based on number of keys in object = 1 with time only
  original_json.profile = remove_empty_profile(original_json.profile)
  let res_str = JSON.stringify(original_json, null, "\t")
  console.log("finished " + res_str)
  return res_str
}

function remove_empty_profile(profile_array) {
  let res = []
  for (let i = 0; i < profile_array.length; i++) {
    let key_count = Object.keys(profile_array[i]).length
    // only has time ms as a result of removing network shouldb e ignored
    if (key_count > 1) {
      console.log(JSON.stringify(profile_array[i]))
      console.log(key_count)
      res.push(profile_array[i])
    }
  }
  return res
}

function insert_network_profile(profile_array, time, values) {
  let i = 0;
  let res = [];
  let inserted = false
  for (i = 0; i < profile_array.length; i++) {
    // look ahead if possible
    if (profile_array[i].time_ms == time) {
      profile_array[i].network = values;
      res.push(profile_array[i]);
      inserted = true;
    } else if (profile_array[i].time_ms > time) {
      // insert current first then add the one we have
      if (!inserted) {
        console.log("inserting new")
        res.push({ network: values, time_ms: time });
        inserted = true;
      }
      res.push(profile_array[i]);
    } else {
      res.push(profile_array[i]);
    }
  }
  // bigger than the last one
  if (
    profile_array.length > 0 &&
    profile_array[profile_array.length - 1].time_ms < time && !inserted
  ) {
    // insert at the end
    res.push({ network: values, time_ms: time });
  }
  return res;
}
