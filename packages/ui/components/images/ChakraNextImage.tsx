import { chakra, ChakraProps } from "@chakra-ui/react";
import Image, { ImageProps } from "next/image";

/**
 * Interface for the properties extended from `ImageProps` and `ChakraProps`.
 */
interface ExtendedImageProps
  extends Omit<
      ImageProps,
      "color" | "fill" | "height" | "objectFit" | "objectPosition" | "width"
    >,
    ChakraProps {
  alt: ImageProps["alt"];
  src: ImageProps["src"];
  width: ImageProps["width"];
  height: ImageProps["height"];
  w?: string;
  h?: string;
}

/**
 * A reusable image component that enables next/image optimization.
 *
 * @param {ExtendedImageProps} props - The properties of the image.
 * @returns {JSX.Element} The image component.
 *
 * @see {@link https://www.jamesperkins.dev/post/using-next-image-with-chakra/}
 * @see {@link https://github.com/chakra-ui/chakra-ui/discussions/2475#discussioncomment-229471}
 * @see {@link https://nextjs.org/docs/pages/api-reference/components/image}
 *
 * @example
 *  <Flex w="100%" h="100%" position="relative">
 *    <GenericNextImage src="/your-image" alt="your alt" width={100} height={200} zIndex={2} />
 *  </Flex>
 */
export const GenericNextImage: React.FC<ExtendedImageProps> = ({
  alt,
  src,
  width,
  height,
  w = "auto",
  h = "auto",
  ...rest
}: ExtendedImageProps) => (
  <ChakraNextImage
    src={src}
    alt={alt}
    width={width}
    height={height}
    w={w}
    h={h}
    {...rest}
  />
);

/**
 * A Chakra UI wrapper around the next/image Image component, with some
 * default styles and prop forwarding.
 */
const ChakraNextImage = chakra(Image, {
  baseStyle: {
    objectFit: "cover",
  },
  shouldForwardProp: (prop) =>
    [
      "height",
      "width",
      "quality",
      "src",
      "alt",
      "sizes",
      "fill",
      "loading",
      "priority",
      "loader",
      "placeholder",
      "style",
      "onLoadingComplete",
      "onLoad",
      "onError",
      "blurDataURL",
    ].includes(prop),
});
