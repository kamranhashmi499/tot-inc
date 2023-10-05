import {GraphqlQueryError} from "@shopify/shopify-api";
import shopify from "./shopify.js";

const totFileUrl =
  "https://cdn.shopify.com/s/files/1/0838/6111/1085/files/tot_54e8e552-0b7c-4d33-bfe8-90f8f559b42a.js?v=1696372623";

const addFileMutation = `
mutation {
  scriptTagCreate(input: {
    src: "${totFileUrl}"
    displayScope: ONLINE_STORE
  }) {
    scriptTag {
      id
      src
    }
    userErrors {
      field
      message
    }
  }
}
`;

const getScriptTags = `query {
  scriptTags(first: 50){
    edges {
      node {
        id
        src
        displayScope
        createdAt
        updatedAt
        legacyResourceId
      }
    }
  }
}`;

export default async function addFile(session) {
  const client = new shopify.api.clients.Graphql({session});
  try {

  //   const orderID = "gid://shopify/Order/5530481131821";

  //   const tagsAddMutation = `
  //   mutation {
  //     tagsAdd(
  //       id: "${orderID}",
  //       tags: ["taxes_collected"]
  //     ) {
  //       userErrors {
  //         field
  //         message
  //       }
  //       node {
  //         id
  //       }
  //     }
  //   }
  // `;

    const getScriptTagsResp = await client.query({
      data: {
        query: getScriptTags,
      },
    });

    const deleteScriptTag = async (id) => {
      await client.query({
        data: {
          query: `mutation {
            scriptTagDelete(id: "${id}") {
              deletedScriptTagId
              userErrors {
                field
                message
              }
            }
          }`,
        },
      });
    };

    const scriptTagIds = getScriptTagsResp.body.data.scriptTags.edges.map(
      (item) => item.node.id
    );
    scriptTagIds.forEach(deleteScriptTag);

    const scriptTagResp = await client.query({
      data: {
        query: addFileMutation,
      },
    });

    return scriptTagResp.body.data.scriptTagCreate.scriptTag;
  } catch (error) {
    if (error instanceof GraphqlQueryError) {
      throw new Error(
        `${error.message}\n${JSON.stringify(error.response, null, 2)}`
      );
    } else {
      throw error;
    }
  }
}
