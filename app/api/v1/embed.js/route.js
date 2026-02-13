import { NextResponse } from "next/server";

export async function GET(request) {
  const origin = request.nextUrl.origin;

  const script = `(function(){
  function createWidget(config) {
    var target = document.querySelector(config.selector || "#recommender-root");
    if (!target) return;

    var button = document.createElement("button");
    button.textContent = config.buttonText || "Get Recommendations";
    button.style.padding = "10px 14px";
    button.style.borderRadius = "8px";
    button.style.border = "1px solid #ddd";
    button.style.cursor = "pointer";

    var pre = document.createElement("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.marginTop = "12px";

    button.onclick = async function () {
      var res = await fetch((config.apiBase || "${origin}") + "/api/v1/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config.payload || {})
      });
      var data = await res.json();
      pre.textContent = JSON.stringify(data, null, 2);
    };

    target.innerHTML = "";
    target.appendChild(button);
    target.appendChild(pre);
  }

  window.RecommenderWidget = { mount: createWidget };
})();`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}
