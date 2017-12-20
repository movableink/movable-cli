import CD from "cropduster";
import jQuery from "jquery";
import StudioApp from "studio-app";

class <%= namespace %> extends StudioApp {
  constructor() {
    super();

    this.foo = this.param("mi_foo", { type: "float", defaultValue: () => 1.23 });
    this.bar = this.param("mi_bar", { type: "string", defaultValue: () => "world" });
  }

  render() {
    // Rendering code goes here

    this.fillElements();
    this.autoresizeTags();
    this.waitForImageAssets();
  }

  // Defining this method will override the default, which fills tags
  // using CD.params()
  fillElements() {
    this.replaceTokens(this.tags, Object.assign({
      bar: this.bar
    }, CD.params()));
  }
}

export default <%= namespace %>;
