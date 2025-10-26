"use client"
import Image from "next/image"

const ExploreBtn = () => {
	return (
		<button
			onClick={()=>console.log("click")}
			type="button"
			id="explore-btn"
			className="mt-7 mx-auto"
		>
			<a href="#events">
				Explore Events
				<Image src="/icons/arrow-down.svg" alt="arrow-down" width={24} height={24}></Image>
			</a>
		</button>
	)
}
export default ExploreBtn
