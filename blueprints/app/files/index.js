import CD from "cropduster";
import jQuery from "jquery";
import StudioApp from "studio-app";

class <%= namespace %> extends StudioApp {
  constructor() {
    super();
  }

  render() {
    // Rendering code goes here

    this.fillElements();
    this.autoresizeTags();
    this.waitForImageAssets();
  }
}

export default <%= namespace %>;
