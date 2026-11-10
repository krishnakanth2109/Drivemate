import React from "react";
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  Platform,
  TextStyle,
  TextProps,
  TextInputProps,
} from "react-native";

export function getPoppinsFontFamily(
  fontWeight?: TextStyle["fontWeight"],
  currentFontFamily?: string
): string {
  // If a specific monospace/courier font was explicitly chosen, preserve it
  if (
    currentFontFamily &&
    currentFontFamily !== "System" &&
    !currentFontFamily.includes("Poppins") &&
    !currentFontFamily.includes("PP-")
  ) {
    return currentFontFamily;
  }

  const weight = String(fontWeight || "").toLowerCase();
  switch (weight) {
    case "100":
    case "200":
    case "300":
    case "light":
      return "Poppins-Light";
    case "500":
    case "medium":
      return "Poppins-Medium";
    case "600":
    case "semibold":
      return "Poppins-SemiBold";
    case "700":
    case "800":
    case "900":
    case "bold":
      return "Poppins-Bold";
    case "400":
    case "normal":
    default:
      return "Poppins-Regular";
  }
}

const OriginalText: any = RNText;
const OriginalTextInput: any = RNTextInput;

const CustomText = React.forwardRef<any, TextProps>((props, ref) => {
  const flat = (StyleSheet.flatten<TextStyle>(props.style as any) || {}) as TextStyle;
  const targetFont = getPoppinsFontFamily(flat.fontWeight, flat.fontFamily);

  const resolvedStyle = [
    props.style,
    {
      fontFamily: targetFont,
      ...(Platform.OS === "android" ? { fontWeight: "normal" as const } : {}),
    },
  ];

  return React.createElement(OriginalText, {
    ...props,
    ref,
    style: resolvedStyle,
  });
});

Object.assign(CustomText, OriginalText);
(CustomText as any).displayName = "Text";

const CustomTextInput = React.forwardRef<any, TextInputProps>((props, ref) => {
  const flat = (StyleSheet.flatten<TextStyle>(props.style as any) || {}) as TextStyle;
  const targetFont = getPoppinsFontFamily(flat.fontWeight, flat.fontFamily);

  const resolvedStyle = [
    props.style,
    {
      fontFamily: targetFont,
      ...(Platform.OS === "android" ? { fontWeight: "normal" as const } : {}),
    },
  ];

  return React.createElement(OriginalTextInput, {
    ...props,
    ref,
    style: resolvedStyle,
  });
});

Object.assign(CustomTextInput, OriginalTextInput);
(CustomTextInput as any).displayName = "TextInput";
if (OriginalTextInput.State) {
  (CustomTextInput as any).State = OriginalTextInput.State;
}

try {
  const RN = require("react-native");
  Object.defineProperty(RN, "Text", {
    configurable: true,
    enumerable: true,
    get: () => CustomText,
  });
  Object.defineProperty(RN, "TextInput", {
    configurable: true,
    enumerable: true,
    get: () => CustomTextInput,
  });
} catch (e) {
  console.warn("Failed to apply global font override to react-native exports", e);
}

export { CustomText as Text, CustomTextInput as TextInput };
