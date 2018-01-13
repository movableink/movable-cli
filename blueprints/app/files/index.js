import CD from "cropduster";
import jQuery from "jquery";
import StudioApp from "studio-app";

class <%= namespace %> extends StudioApp {
  constructor() {
    super();
  }

  render() {
    // Rendering code goes here

    const bgColor = this.options.backgroundColor || "white";
    document.body.style.background = bgColor;

    const name = this.param("name", { defaultValue: "world" });

    this.replaceTokens(this.tags, { name });
    this.autoresizeTags();
    this.waitForImageAssets();
  }
}

export default <%= namespace %>;
