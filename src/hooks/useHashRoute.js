import { useEffect, useState } from "react";

const DEFAULT_PATH = "/almanac";

/* "#/wheel?species=a,b" → { path: "/wheel", query: "species=a,b" }. An empty
   or malformed hash falls back to the default tool without rewriting the URL. */
function parse() {
  const h = window.location.hash.replace(/^#/, "");
  const [path, query = ""] = h.split("?");
  return { path: path.startsWith("/") ? path : DEFAULT_PATH, query };
}

export function useHashRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const navigate = (path) => { window.location.hash = path; };
  return { ...route, navigate };
}
