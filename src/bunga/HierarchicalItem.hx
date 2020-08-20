package bunga;

import bunga.DetailData;
import haxe.DynamicAccess;

@:keep
@:expose
@:structInit
class HierarchicalItem extends Item {
	public var type:String;
	public var hid:String;
	public var parentId:Null<String>;
	public var topLevel:Bool;
	public var hidden = false;
	public var children:DynamicAccess<HierarchicalItem>;
	private var childrenIds:Array<String>;

	public function hydrateChildren(hierarchyById:DynamicAccess<HierarchicalItem>) {
		for (id in childrenIds) {
			final child = hierarchyById[id];
			if (child != null) {
				trace('Child not found: $name > $id');
			} else {
				children[id] = hierarchyById[id];
			}
		}
	}

	public inline function new(type, id, hid, parentId, topLevel, childrenIds:Array<String>, data:DetailData) {
		super(id, data);
		this.type = type;
		this.hid = hid;
		this.parentId = parentId;
		this.topLevel = topLevel;
		this.children = {};
		this.childrenIds = childrenIds;
	}
}
