// Remotion render config — `remotion render` ve `remotion lambda render` ortak ayarları.
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(1);
