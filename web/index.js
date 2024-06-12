// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

// GETTING STORE INFORMATION
app.get("/api/store/info", async(req, res) => {
  let storeInfo = await shopify.api.rest.Shop.all({
    session: res.locals.shopify.session,
  });
  res.status(200).send(storeInfo);
});

// GETTING STORE ORDERS
app.get("/api/orders/all", async(req, res) => {
  let storeOrders = await shopify.api.rest.Order.all({
    session: res.locals.shopify.session,
    status: "any",
  });
  res.status(200).send(storeOrders);
});

// READ ALL PRODUCTS
app.get("/api/product/count", async(req, res) => {
  let totalProducts = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(totalProducts);
});

// READ ALL COLLECTIONS
app.get("/api/collection/count", async(req, res) => {
  let totalCollections = await shopify.api.rest.CustomCollection.all({
    session: res.locals.shopify.session,
  });
  res.status(200).send(totalCollections);
})

// READ ALL PRODUCTS
app.get("/api/products/all", async(req, res) => {
  let allProducts = await shopify.api.rest.Product.all({
    session: res.locals.shopify.session,
  });
  res.status(200).send(allProducts);
});

// UPDATE A PRODUCT
app.put("/api/product/update", async(req, res) => {
  let getProduct = req.body;
  let updateProduct = new shopify.api.rest.Product({
    session: res.locals.shopify.session,
  });
  updateProduct.id = getProduct.id;
  updateProduct.title = getProduct.title;
  await updateProduct.save({
    update: true,
  });
  res.status(200).send({Message: "Product Updated Successfully"})
});
//CREATE A PRODUCT
app.post("/api/product/create", async (req, res) => {
  try {
    const { title, body_html, vendor, images, variants } = req.body;

    let newProduct = new shopify.api.rest.Product({
      session: res.locals.shopify.session,
    });

    newProduct.title = title;
    newProduct.body_html = body_html;
    newProduct.vendor = vendor;
    newProduct.images = images;
    newProduct.variants = variants;

    await newProduct.save({
      update: true,
    });

    res.status(200).send({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to create product" });
  }
});


// DELETE A PRODUCT
app.delete("/api/product/delete/:productId", async (req, res) => {
  const productId = req.params.productId;
  
  try {
    await shopify.api.rest.Product.delete({
      session: res.locals.shopify.session,
      id: productId,
    });
    res.status(200).send({ Message: "Product Deleted Successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ error: "Failed to delete product" });
  }
});


// app.post("/api/metafield/createIngredients", async (req, res) => {
//   const { ownerId } = req.body; // ID of the product to which the metafield will be added

//   // Define the structure of the ingredients metafield
//   const ingredientsMetafieldDefinition = {
//     name: "Ingredients",
//     namespace: "custom",
//     key: "ingredients",
//     type: "json_string", // JSON type to store an array of ingredient objects
//     description: "Ingredients for the product",
//     ownerType: "PRODUCT",
//     pin: true,
//     visibleToStorefrontApi: true,
//     useAsCollectionCondition: true,
//   };

//   // Create metafield definition for the ingredients metafield using GraphQL mutation
//   const createIngredientsMetafieldDefinitionQuery = {
//     query: `
//       mutation CreateIngredientsMetafieldDefinition($definition: MetafieldDefinitionInput!) {
//         metafieldDefinitionCreate(definition: $definition) {
//           createdDefinition {
//             id
//             name
//           }
//           userErrors {
//             field
//             message
//           }
//         }
//       }
//     `,
//     variables: {
//       definition: ingredientsMetafieldDefinition
//     }
//   };

//   try {
//     // Execute GraphQL mutation to create the metafield definition for ingredients
//     const createMetafieldResponse = await shopify.api.clients.Graphql.query(createIngredientsMetafieldDefinitionQuery);

//     // Handle metafield definition creation response here

//     // Add metafield to product using GraphQL mutation
//     const addMetafieldToProductQuery = {
//       query: `
//         mutation AddIngredientsMetafieldToProduct($input: ProductMetafieldInput!) {
//           productMetafieldUpsert(input: $input) {
//             userErrors {
//               field
//               message
//             }
//           }
//         }
//       `,
//       variables: {
//         input: {
//           namespace: ingredientsMetafieldDefinition.namespace,
//           key: ingredientsMetafieldDefinition.key,
//           value: "", // Initially, the value will be an empty array
//           valueType: ingredientsMetafieldDefinition.type.toUpperCase(),
//           ownerType: ingredientsMetafieldDefinition.ownerType,
//           ownerId
//         }
//       }
//     };

//     // Execute GraphQL mutation to add the metafield to the product
//     const addMetafieldResponse = await shopify.api.clients.Graphql.query(addMetafieldToProductQuery);

//     // Handle adding metafield to product response here

//     res.status(200).send({ message: "Ingredients metafield created and added to product successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: "An error occurred while creating and adding ingredients metafield" });
//   }
// });


app.post('/api/product/addIngredients', async (req, res) => {
  const { productId, ingredients } = req.body;

  try {
    // Construct the GraphQL query to create/update the metafield
    const query = `
      mutation AddProductMetafield($productId: ID!, $metafields: [MetafieldsInput!]!) {
        productUpdate(input: {
          id: $productId,
          metafields: $metafields
        }) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      productId: `gid://shopify/Product/${productId}`,
      metafields: [
        {
          namespace: "custom",
          key: "ingredients",
          type: "json",
          value: JSON.stringify(ingredients),
        },
        {
          namespace: "custom",
          key: "definition",
          type: "single_line_text_field",
          value: "Ingredient list for the product",
        },
      ],
    };

    const client = new Shopify.Clients.Graphql(req.shop, req.accessToken);
    const response = await client.query({
      data: {
        query,
        variables,
      },
    });

    if (response.body.data.productUpdate.userErrors.length) {
      throw new Error(
        response.body.data.productUpdate.userErrors.map((error) => error.message).join(', ')
      );
    }

    res.status(200).send(response.body.data.productUpdate.product);
  } catch (error) {
    if (error instanceof GraphqlQueryError) {
      console.error('GraphQL Query Error:', error.response);
    } else {
      console.error('Error adding ingredients:', error);
    }
    res.status(500).send({ error: 'Failed to add ingredients' });
  }
});


app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});



app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
