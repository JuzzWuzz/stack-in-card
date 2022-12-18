# Stack-In-Card by JuzzWuzz <!-- omit in toc -->

A basic card that provided a dropdown populated with the effect list of the supplied light entity.

![all](examples/stack-in-card.jpg)

## Table of Contents <!-- omit in toc -->

- [Configuration](#configuration)
- [Installation](#installation)
- [Examples](#examples)
- [Development](#development)

## Configuration

| Name                 | Type    | Default      | Supported options        | Description                                                |
| -------------------- | ------- | ------------ | ------------------------ | ---------------------------------------------------------- |
| `type`               | string  | **Required** | `custom:stack-in-card`   | Type of the card                                           |
| `title`              | string  | optional     | Any string that you want | The title to show for the card                             |
| `hide_if_off`        | boolean | `false`      | `true` \| `false`        | If the card must be hidden when the light's state is `off` |
| `hide_if_no_effects` | boolean | `false`      | `true` \| `false`        | If the card must be hidden when the light has no effects   |

## Installation

1. Download the [stack-in-card](https://github.com/JuzzWuzz/stack-in-card/releases/latest/download/stack-in-card.js)
2. Place the file in your `config/www` folder
3. Include the card code in your `ui-lovelace-card.yaml`

   ```yaml
   title: Home
   resources:
     - url: /local/stack-in-card.js
       type: module
   ```

4. Write configuration for the card in your `ui-lovelace.yaml`

## Examples

Show the card even if the light is `off` or has no effects.

```yaml
- type: custom:lighteffect-card
  entity: light.bed_light
  title: "Always visible"
```

## Development

You can run the code locally by the `Serve` plugin using the `npm start` command. This will compile and serve the code so it can be loaded into a DevContainer or a real instance of Home Assistant.

To make use of DevContainers you'll need the `Dev Containers` extension and then to load the project in the Dev Container.

From there you'll need to start a terminal and execute: `container start`

Other commands:

| Command     | Description                                                            |
| ----------- | ---------------------------------------------------------------------- |
| init        | This will give you a fresh development environment.                    |
| run         | This will run the default action for the container you are using.      |
| start       | This will start Home Assistant on port 9123.                           |
| check       | This will run Home Assistant config check.                             |
| set-version | Install a specific version of Home Assistant.                          |
| upgrade     | Upgrade the installed Home Assistant version to the latest dev branch. |
| help        | Shows this help                                                        |
