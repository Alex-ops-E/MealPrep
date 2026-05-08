import { useTheme } from "@/contexts/ThemeContext";
import colors from "@/constants/colors";

export function useColors() {
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
