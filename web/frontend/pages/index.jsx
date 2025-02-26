import {
  Layout,
  Page,
} from "@shopify/polaris";
import { Card, OrderDetails, OrderGraphs } from "../components";
import useApiRequest from "../hooks/useApiRequest";

export default function HomePage() {

  // let {responseData, isLoading, error} = useApiRequest("/api/orders/all", "GET");
  let productResult = useApiRequest("/api/product/count", "GET");
  console.log(productResult);
  // let collectionResult = useApiRequest("/api/collection/count", "GET");
  // console.log(collectionResult);
  // if(error) {
  //   console.log(error);
  // }

  return (
    <Page fullWidth>
      <div className="home-section">
        <div className="graphs-section">
          {  <OrderGraphs />}
        </div>
        <div className="cards-section">
        {/* responseData &&  */}
          {
            <Layout>
              {/* <Card title="Total Orders" orders={responseData} total/> */}
              {/* <Card title="Fulfilled Orders" orders={responseData} fulfilled/> */}
              {/* <Card title="Remains Orders" orders={responseData} remains/> */}
              <Card title="Total Products" orders={productResult?.responseData?.count} productcount/>
              {/* <Card title="Total Collections" orders={collectionResult.responseData} collectioncount/> */}
            </Layout>
          }
        </div>
        <div className="order-details-section">
        {/* responseData &&  */}
          {/* {<OrderDetails/>} */}
        </div>
      </div>
    </Page>
  );
}
