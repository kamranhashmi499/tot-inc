const variantID = 47175350583597;

fetch(`${window.Shopify.routes.root}cart.js`)
  .then((response) => response.json())
  .then((data) => {
    if (data && data.items) {
      const itemIDs = data.items.map((item) => item.id);

      if (itemIDs.includes(variantID)) {
        const url = `${window.Shopify.routes.root}cart/update.js`;
        const updates = {[variantID]: 0};

        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({updates}),
        })
          .then((response) => response.json())
          .then(() => window.location.reload())
          .catch((error) => console.error("Error:", error));
      }
    }
  });
