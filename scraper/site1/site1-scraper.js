/********************************************************************************************************
 * @brief Scrapes and returns an array of some website's listings with a maximum length of 
 * 		  LISTINGS_PER_SEARCH. Most recently posted listings are returned first, with any marked as seen
 * 		  being discarded. In debug mode, no listings are discarded regardless of their status or content.
 ********************************************************************************************************/
export function getSite1Listings() {
	let listings = [];
	
	let newListing = {
		title: 'First Site1 listing',
		// url: 'link-to-listing',
		image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png',
		subheading: 'Listing subheader',
		description: 'Some sort of description...',
		postDate: 'Posted at some point',
		id: 34982834834
	}
	listings.push(newListing);

	newListing = {
		title: 'Second Site2 listing',
		// url: 'link-to-listing',
		image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png',
		subheading: 'Listing subheader',
		description: 'Some sort of description...',
		postDate: 'Posted at some point',
		id: 43534537234
	}
	listings.push(newListing);

	return listings;
}