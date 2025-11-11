import ProductSelect from "../components/sections/ProductSelect";
import PurchaseSummary from "../components/sections/PurchaseSummary";

const Membership = () => {
    return (
        <div className="container mx-auto py-14 max-w-sm">
            <ProductSelect />
            <div className="mt-10">
                <PurchaseSummary />
            </div>
        </div>
    )
}

export default Membership;
