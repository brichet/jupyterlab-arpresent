import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { LogoIcon } from './components/Icons';
import { RootDisplayWidget } from './components/RootDisplay';
import {
  IArPresentRegistryToken,
  IModelRegistry,
  ModelManager
} from './registry';
import { SidebarWidget } from './widgets/Sidebar';

/**
 * Initialization data for the jupyterlab_arpresent extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_arpresent',
  description: 'Video presentation over WebRTC with AR capabilities.',
  autoStart: true,
  requires: [ICommandPalette, ILauncher, IArPresentRegistryToken],
  optional: [ILayoutRestorer, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    launcher: ILauncher | null,
    registry: IModelRegistry,
    settingRegistry: ISettingRegistry | null,
    restorer: ILayoutRestorer | null
  ) => {
    console.log('JupyterLab extension jupyterlab_arpresent is activated!');

    // Register default models
    registry.registerModel({
      name: 'Duck',
      url: 'https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Duck/glTF/Duck.gltf',
      type: 'url'
    });

    registry.registerModel({
      name: 'Brain Stem',
      url: 'https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/BrainStem/glTF/BrainStem.gltf',
      type: 'url'
    });

    let widget: MainAreaWidget<RootDisplayWidget>;

    const sidebarPanel = new SidebarWidget(
      registry.modelRegistry,
      registry.modelRegistryChanged
    );
    sidebarPanel.id = 'AR-sidepanel';

    // Add an application command
    const arPresentCommand: string = 'arpresent:open';
    app.commands.addCommand(arPresentCommand, {
      label: 'AR Presentation',
      icon: LogoIcon,
      execute: () => {
        // Regenerate the widget if disposed
        if (!widget || widget.isDisposed) {
          const content = new RootDisplayWidget();
          widget = new MainAreaWidget({ content });
          widget.id = 'arpresent-jupyterlab';
          widget.title.label = 'AR Presentation';
          widget.title.closable = true;
          widget.title.icon = LogoIcon;
        }
        // if (!tracker.has(widget)) {
        //   // Track the state of the widget for later restoration
        //   tracker.add(widget);
        // }
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }

        // Activate the widget
        app.shell.activateById(widget.id);
        app.shell.add(widget, 'main');
        app.shell.add(sidebarPanel, 'left', { rank: 2000 });
      }
    });

    // Add the command to the palette.
    palette.addItem({ command: arPresentCommand, category: 'Video Chat' });

    if (launcher) {
      launcher.add({
        command: arPresentCommand,
        category: 'Video Chat',
        rank: 2
      });
    }

    // Track and restore the widget state
    // const tracker = new WidgetTracker<MainAreaWidget<ArPresent>>({
    //   namespace: 'arpresent'
    // });
    // if (restorer) {
    //   restorer.restore(tracker, {
    //     command,
    //     name: () => 'arpresent'
    //   });
    // }
  }
};

const modelRegistryPlugin: JupyterFrontEndPlugin<IModelRegistry> = {
  id: 'jupyterlab_arpresent:registry',
  description: 'Registry of available models to display in ar present',
  autoStart: true,
  requires: [],
  provides: IArPresentRegistryToken,
  activate: () => {
    const modelRegistryManager = new ModelManager();

    return modelRegistryManager;
  }
};

const duckPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_duck',
  description: 'a duck.',
  autoStart: true,
  requires: [ICommandPalette, IArPresentRegistryToken],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    registry: IModelRegistry
  ) => {
    console.log('JupyterLab extension The Duck is activated!');

    const duckPluginCommand: string = 'duckPlugin:open';
    app.commands.addCommand(duckPluginCommand, {
      label: 'The Duck',
      execute: () => {
        console.log('executing the duck');
        registry.registerModel({
          name: 'Suzanne',
          url: 'https://github.khronos.org/glTF-Sample-Viewer-Release/assets/models/Models/Suzanne/glTF/Suzanne.gltf',
          type: 'url'
        });
      }
    });

    palette.addItem({ command: duckPluginCommand, category: 'Video Chat' });
  }
};

export default [plugin, modelRegistryPlugin, duckPlugin];
