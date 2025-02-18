"use client";
import {
  Alert,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stack,
  Select,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  Text,
  useDisclosure,
  FormHelperText,
  FormErrorMessage,
  IconButton,
  useToast,
  Tag,
  Box,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { TbPlus, TbCopy, TbTrash } from "react-icons/tb";
import { useForm } from "react-hook-form";
import API from "@/lib/api";
import { analytics } from "@/lib/analytics";
import { usePsychicLink } from "@psychic-api/link";

function DocumentRow({ id, name, type, url, onDelete }) {
  const toast = useToast();
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);

    toast({
      description: "Copied to clipboard",
      position: "top",
      colorScheme: "gray",
    });
  };

  return (
    <Tr>
      <Td>
        <Text noOfLines={1}>{name}</Text>
      </Td>
      <Td>
        <HStack>
          <Text noOfLines={1}>{id}</Text>
          <IconButton
            size="sm"
            icon={<Icon color="orange.500" fontSize="lg" as={TbCopy} />}
            onClick={() => copyToClipboard(id)}
          />
        </HStack>
      </Td>
      <Td>
        <HStack>
          <Text noOfLines={1}>{url}</Text>
          <IconButton
            size="sm"
            icon={<Icon color="orange.500" fontSize="lg" as={TbCopy} />}
            onClick={() => copyToClipboard(url)}
          />
        </HStack>
      </Td>
      <Td>{type}</Td>
      <Td textAlign="right">
        <IconButton
          size="sm"
          variant="ghost"
          icon={<Icon fontSize="lg" as={TbTrash} />}
          onClick={() => onDelete(id)}
        />
      </Td>
    </Tr>
  );
}

export default function DocumentsClientPage({ data, session }) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const router = useRouter();
  const api = new API(session);
  const {
    formState: { isSubmitting, errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm();

  const documentType = watch("type");
  const { openPsychic, isPsychicReady, isPsychicLoading} = usePsychicLink(publicKey, () => {});

  const onSubmit = async (values) => {
    const { type, name, url, auth_type, auth_key, auth_value } = values;
    const payload = {
      name,
      type,
      url,
      authorization: auth_key && {
        type: auth_type,
        key: auth_key,
        value: auth_value,
      },
    };

    await api.createDocument(payload);

    analytics.track("Created Document", { ...payload });
    router.refresh();
    reset();
    onClose();
  };

  const handleDelete = async (id) => {
    await api.deleteDocument({ id });

    analytics.track("Deleted Document", { id });
    router.refresh();
  };

  const onConnectAPI = async () => {
    openPsychic(session.user.user.id);
  };

  return (
    <Stack flex={1} paddingX={12} paddingY={12} spacing={6}>
      <HStack justifyContent="space-between" spacing={12}>
        <Stack>
          <Heading as="h1" fontSize="2xl">
            Documents
          </Heading>
          <Text color="gray.400">
            Upload documents and use them to do question answering.
          </Text>
          <Text color="gray.400">
            Superagent will automatically split them into chunks and ingest them
            into a vector database for retrieval.
          </Text>
        </Stack>
        <Button
          leftIcon={<Icon as={TbPlus} />}
          alignSelf="flex-start"
          onClick={onOpen}
        >
          New document
        </Button>
      </HStack>
      <Stack spacing={4}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>ID</Th>
              <Th>URL</Th>
              <Th>Type</Th>
              <Th>&nbsp;</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.map(({ id, name, type, url }) => (
              <DocumentRow
                key={id}
                id={id}
                name={name}
                url={url}
                type={type}
                onDelete={(id) => handleDelete(id)}
              />
            ))}
          </Tbody>
        </Table>
      </Stack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>New document</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Stack>
                <FormControl isRequired isInvalid={errors?.name}>
                  <FormLabel>Name</FormLabel>
                  <Input
                    type="text"
                    {...register("name", { required: true })}
                  />
                  <FormHelperText>A document name.</FormHelperText>
                  {errors?.name && (
                    <FormErrorMessage>Invalid name</FormErrorMessage>
                  )}
                </FormControl>
                <FormControl isRequired isInvalid={errors?.url}>
                  <FormLabel>URL</FormLabel>
                  <Input type="text" {...register("url", { required: true })} />
                  <FormHelperText>
                    A publicly accessible URL to your document.
                  </FormHelperText>
                  {errors?.url && (
                    <FormErrorMessage>Invalid URL</FormErrorMessage>
                  )}
                </FormControl>
                <FormControl isRequired isInvalid={errors?.type}>
                  <FormLabel>Type</FormLabel>
                  <Select {...register("type", { required: true })}>
                    <option value="PDF">PDF</option>
                    <option value="TXT">TXT</option>
                    <option value="URL">URL</option>
                    <option value="YOUTUBE">Youtube</option>
                    <option value="MARKDOWN">Markdown</option>
                    <option value="PSYCHIC">Psychic API</option>
                  </Select>
                  {errors?.type && (
                    <FormErrorMessage>Invalid type</FormErrorMessage>
                  )}
                </FormControl>
                {documentType === "OPENAPI" && (
                  <FormControl>
                    <Alert variant="solid" colorScheme="red">
                      This feature is exeperimental, use with caution.
                    </Alert>
                    <Stack marginTop={4}>
                      <FormLabel>Authorization</FormLabel>
                      <HStack>
                        <Select {...register("auth_type")}>
                          <option value="header">Header</option>
                          <option value="query">Query params</option>
                        </Select>
                        <Input
                          placeholder="Header or query param key"
                          type="text"
                          {...register("auth_key")}
                        />
                      </HStack>
                      <Box>
                        <Input
                          placeholder="Header or query param value"
                          type="text"
                          {...register("auth_value")}
                        />
                        <FormHelperText>
                          If the OpenApi spec your are using requires
                          authentication you need to use the fields above.
                        </FormHelperText>
                      </Box>
                    </Stack>
                  </FormControl>
                )}
                {documentType === "PSYCHIC" && (
                  <FormControl>
                    <Stack marginTop={4}>
                    <Button type="submit" disabled={!isPsychicReady} onClick={onConnectPsychic} isLoading={isPsychicLoading}>
                      Connect
                    </Button>
                    </Stack>
                  </FormControl>
                )}
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
