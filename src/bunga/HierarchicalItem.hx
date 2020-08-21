package bunga;

import bunga.DetailData;
import haxe.DynamicAccess;

@:keep
@:expose
@:structInit
class HierarchicalItem extends DetailData {
	public var type:String;
	public var parentId:Null<String>;
	public var topLevel:Bool;
	public var hidden = false;
	public var children:DynamicAccess<HierarchicalItem>;
	private var childrenIds:Array<String>;

	public function hydrateChildren(hierarchyById:DynamicAccess<HierarchicalItem>) {
		for (id in childrenIds) {
			final child = hierarchyById[id];
			if (child == null) {
				trace('Child not found: $name > $id');
			} else {
				children[id] = hierarchyById[id];
			}
		}
	}

	public function new(type, parentId, childrenIds:Array<String>, data:DetailData) {
		super(data.id, data.name, data.author, data.nameCN, data.fasc,
			data.page, data.detail, data.photos, data.name2, data.vernacularName, data.vernacularName2,
			data.meaning, data.noHerbier, data.website, data.herbariumPicture, data.extra);
		this.type = type;
		this.parentId = parentId;
		this.topLevel = parentId == null;
		this.children = {};
		this.childrenIds = childrenIds;
	}
}
