import React, { useState, useCallback } from "react";
import useApiRequest from "../hooks/useApiRequest";
import { Page, Layout, LegacyCard, Grid, Toast, Frame, TextField, Button } from "@shopify/polaris";
import { Add } from "@mui/icons-material";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

function Products() {
  let { responseData, isLoading, error } = useApiRequest("/api/products/all", "GET");
  let [isModalOpen, setIsModalOpen] = useState(false);
  let [isCreating, setIsCreating] = useState(false);
  let [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  let [loading, setLoading] = useState(false);
  let [toastActive, setToastActive] = useState(false);
  let [toastMessage, setToastMessage] = useState("");
  let [formData, setFormData] = useState({
    title: "",
    body_html: "",
    vendor: "",
    images: [{ src: "" }],
    variants: [{ price: "" }],
  });
  let fetch = useAuthenticatedFetch();
  let [ingredientInputs, setIngredientInputs] = useState([
    { image: "", title: "", description: "" },
  ]);

  const toggleToast = useCallback(() => setToastActive((active) => !active), []);

  function productHandler(productid) {
    setIsCreating(false);
    setIsModalOpen(true);
    let searchProduct = responseData?.data.find((elem) => elem.id === productid);
    setFormData(() => ({
      ...searchProduct,
    }));
  }

  let submitHandler = (e) => {
    e.preventDefault();
    setLoading(true);
    const url = isCreating ? "/api/product/create" : "/api/product/update";
    const method = isCreating ? "POST" : "PUT";

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (response.ok) {
          setToastMessage(
            isCreating ? "Product created successfully" : "Product updated successfully"
          );
          setToastActive(true);
          setIsModalOpen(false);
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  };

  let valueHandler = (e) => {
    let { name, value } = e.target;

    if (name.startsWith("images[0].src")) {
      setFormData((prevData) => ({
        ...prevData,
        images: [{ ...prevData.images[0], src: value }],
      }));
    } else if (name.startsWith("variants[0].price")) {
      setFormData((prevData) => ({
        ...prevData,
        variants: [{ ...prevData.variants[0], price: value }],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  let createHandler = () => {
    setIsCreating(true);
    setFormData({
      title: "",
      body_html: "",
      vendor: "",
      images: [{ src: "" }],
      variants: [{ price: "" }],
    });
    setIsModalOpen(true);
  };

  let deleteHandler = async (productId) => {
    try {
      let request = await fetch(`/api/product/delete/${productId}`, {
        method: "DELETE",
      });
      let response = await request.json();
      console.log(response);
      // Handle toast message or any other UI update after successful deletion
    } catch (error) {
      console.log(error);
    }
  };

  const openIngredientModal = (e) => {
    e.stopPropagation();
    setIngredientInputs([{ image: "", title: "", description: "" }]);
    setIsIngredientModalOpen(true);
  };

  const addIngredient = () => {
    setIngredientInputs([
      ...ingredientInputs,
      { image: "", title: "", description: "" },
    ]);
  };

  const handleIngredientChange = (index, key, value) => {
    const updatedIngredients = [...ingredientInputs];
    updatedIngredients[index][key] = value;
    setIngredientInputs(updatedIngredients);
  };

  // const submitIngredients = async () => {
  //   try {
  //     setLoading(true);
  //     // Send ingredient data to backend to update the metafield
  //     const response = await fetch("/api/product/addIngredients", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         productId: formData.id,
  //         ingredients: ingredientInputs,
  //       }),
  //     });
  //     const data = await response.json();
  //     console.log(data);
  //     setLoading(false);
  //     setToastMessage("Ingredients added successfully");
  //     setToastActive(true);
  //     setIsIngredientModalOpen(false);
  //   } catch (error) {
  //     console.error("Error adding ingredients:", error);
  //     setLoading(false);
  //     setToastMessage("Error adding ingredients");
  //     setToastActive(true);
  //   }
  // };


  const submitIngredients = async () => {
    try {
      setLoading(true);
      // Send ingredient data to backend to update the metafield
      const response = await fetch("/api/product/addIngredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: formData.id,
          ingredients: ingredientInputs,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unknown error occurred');
      }
  
      const data = await response.json();
      console.log(data);
      setLoading(false);
      setToastMessage("Ingredients added successfully");
      setToastActive(true);
      setIsIngredientModalOpen(false);
    } catch (error) {
      console.error("Error adding ingredients:", error);
      setLoading(false);
      setToastMessage(`Error adding ingredients: ${error.message}`);
      setToastActive(true);
    }
  };
  
  


  return (
    <Frame>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <button onClick={createHandler} className="button">
              New <Add />
            </button>
          </Layout.Section>
          <Layout.Section>
            <Grid>
              {!isLoading &&
                responseData.data.map((product) => (
                  <Grid.Cell
                    key={product.id}
                    columnSpan={{ xs: 6, sm: 6, md: 2, lg: 4, xl: 3 }}
                  >
                    <div
                      className="card"
                      onClick={() => productHandler(product.id)}
                    >
                      <LegacyCard sectioned>
                        <img
                          src={product?.image?.src}
                          alt="product media"
                          className="product-image"
                        />
                        <h2 className="product-title">{product.title}</h2>
                        <p className="product-price">
                          ${product.variants[0].price}
                        </p>
                        <button
                          onClick={(e) => {e.stopPropagation(); deleteHandler(product.id);}}
                          className="dbutton"
                        >
                          Delete
                        </button>
                        <button onClick={openIngredientModal}>
                          Add Ingredients
                        </button>
                      </LegacyCard>
                    </div>
                  </Grid.Cell>
                ))}
            </Grid>
          </Layout.Section>
        </Layout>
        {isModalOpen && (
          <div className="product-modal">
            <p className="btn-close" onClick={() => setIsModalOpen(false)}>
              X
            </p>
            <div className="modal-form">
              <form onSubmit={submitHandler}>
                <div className="image-block">
                  <img src={formData.images[0].src} alt="product media" />
                </div>
                <div className="form-fields">
                  <input type="hidden" name="id" value={formData.id} />
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={valueHandler}
                    placeholder="Title"
                  />
                  <textarea
                    name="body_html"
                    id="body_html"
                    cols="30"
                    rows="10"
                    value={formData.body_html}
                    onChange={valueHandler}
                    placeholder="Description"
                  ></textarea>
                  <input
                    type="text"
                    name="vendor"
                    id="vendor"
                    value={formData.vendor}
                    onChange={valueHandler}
                    placeholder="Vendor"
                  />
                  <input
                    type="text"
                    name="images[0].src"
                    id="image"
                    value={formData.images[0].src}
                    onChange={valueHandler}
                    placeholder="Image URL"
                  />
                  <input
                    type="number"
                    name="variants[0].price"
                    id="price"
                    value={formData.variants[0].price}
                    onChange={valueHandler}
                    placeholder="Price"
                  />
                  <button
                    className="button pbutton"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="loader"></div>
                    ) : isCreating ? (
                      "Create"
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isIngredientModalOpen && (
          <div className="product-modal-ingredient">
            <p className="btn-close-ingredient" onClick={() => setIsIngredientModalOpen(false)}>
              X
            </p>
            <div className="modal-form-ingredient">
              <h2>Add Ingredients</h2>
              <form>
                <div className="form-fields-ingredient">
                  {ingredientInputs.map((ingredient, index) => (
                    <div key={index} className="ingredient-field">
                      {ingredient.image && (
                        <div className="image-preview-ingredient">
                          <img src={ingredient.image} alt={`ingredient-${index}`} />
                        </div>
                      )}
                      <input
                        type="text"
                        value={ingredient.image}
                        onChange={(e) => handleIngredientChange(index, "image", e.target.value)}
                        placeholder="Image URL"
                      />
                      <input
                        type="text"
                        value={ingredient.title}
                        onChange={(e) => handleIngredientChange(index, "title", e.target.value)}
                        placeholder="Title"
                      />
                      <textarea
                        value={ingredient.description}
                        onChange={(e) => handleIngredientChange(index, "description", e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="button-ingredient add-button-ingredient"
                  >
                    Add More
                  </button>
                  <button
                    className="button-ingredient pbutton-ingredient"
                    type="button"
                    onClick={submitIngredients}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="loader-ingredient"></div>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {toastActive && (
          <Toast content={toastMessage} onDismiss={toggleToast} />
        )}
      </Page>
    </Frame>
  );
}

export default Products;
