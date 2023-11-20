import {
  Button,
  Container,
  Flashbar,
  FlashbarProps,
  Form,
  FormField,
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";
import { AddDataData } from "./types";
import { useForm } from "../../../common/hooks/use-form";
import { useContext, useState } from "react";
import { AppContext } from "../../../common/app-context";
import { useNavigate } from "react-router-dom";
import { Utils } from "../../../common/utils";
import { ResultValue, WorkspaceItem } from "../../../common/types";
import { ApiClient } from "../../../common/api-client/api-client";

export interface AddRssSubscriptionProps {
  data: AddDataData;
  validate: () => boolean;
  selectedWorkspace?: WorkspaceItem;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
}

interface AddRssSubscriptionData {
  rssFeedUrl: string;
  rssFeedTitle: string;
}

export default function AddRssSubscription(props: AddRssSubscriptionProps) {
  const appContext = useContext(AppContext);
  const navigate = useNavigate();
  const [flashbarItem, setFlashbarItem] =
    useState<FlashbarProps.MessageDefinition | null>(null);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);
  const { data, onChange, errors, validate } = useForm<AddRssSubscriptionData>({
    initialValue: () => {
      return {
        rssFeedUrl: "",
        rssFeedTitle: "",
      };
    },
    validate: (form) => {
      const errors: Record<string, string | string[]> = {};

      if (form.rssFeedUrl.length === 0) {
        errors.rssFeedUrl = "Website address is required";
      } else if (Utils.isValidURL(form.rssFeedUrl) === false) {
        errors.rssFeedUrl = "Website address is not valid.";
      }

      return errors;
    },
  });

  const onSubmit = async () => {
    if (!appContext) return;
    let validationResult = validate();
    validationResult = props.validate() && validationResult;
    if (!validationResult) return;
    if (!props.data.workspace?.value) return;

    props.setSubmitting(true);
    setFlashbarItem(null);
    setGlobalError(undefined);

    const apiClient = new ApiClient(appContext);
    const result = await apiClient.documents.addRssFeedSubscription(
      props.data.workspace.value,
      data.rssFeedUrl,
      data.rssFeedTitle
    );

    if (ResultValue.ok(result)) {
      setFlashbarItem({
        type: "success",
        content: "RSS Feed subscribed successfully",
        dismissible: true,
        onDismiss: () => setFlashbarItem(null),
        buttonText: "View RSS Feed Subscriptions",
        onButtonClick: () => {
          navigate(`/rag/workspaces/${props.data.workspace?.value}?tab=rssfeed`);
        },
      });

      onChange({ rssFeedUrl: "" }, true);
    } else {
      setGlobalError(Utils.getErrorMessage(result));
    }

    props.setSubmitting(false);
  };

  const hasReadyWorkspace =
    typeof props.data.workspace?.value !== "undefined" &&
    typeof props.selectedWorkspace !== "undefined" &&
    props.selectedWorkspace.status === "ready";

  return (
    <Form
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            data-testid="create"
            variant="primary"
            onClick={onSubmit}
            disabled={props.submitting || !hasReadyWorkspace}
          >
            Subscribe to RSS Feed
          </Button>
        </SpaceBetween>
      }
      errorText={globalError}
    >
      <SpaceBetween size="l">
        <Container>
          <SpaceBetween size="l">
            <FormField
              label="RSS Feed URL"
              errorText={errors.rssFeedUrl}
              description="Address should start with http:// or https://"
            >
              <Input
                placeholder="https://example.com/rss"
                disabled={props.submitting}
                type="url"
                value={data.rssFeedUrl}
                onChange={({ detail: { value } }) =>
                  onChange({ rssFeedUrl: value })
                }
              />
            </FormField>
            <FormField
              label="RSS Feed Title"
              description="Give your feed a title to recognize it in the future"
            >
              <Input
                placeholder="Cool RSS Feed"
                disabled={props.submitting}
                type="text"
                value={data.rssFeedTitle}
                onChange={({ detail: { value } }) =>
                  onChange({ rssFeedTitle: value })
                }
              />
            </FormField>
          </SpaceBetween>
        </Container>
        {flashbarItem !== null && <Flashbar items={[flashbarItem]} />}
      </SpaceBetween>
    </Form>
  );
}